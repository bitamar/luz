import type { FastifyInstance } from 'fastify';
import * as oidc from 'openid-client';
import { env } from '../env.js';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance) {
  const config = await oidc.discovery(
    new URL('https://accounts.google.com'),
    env.GOOGLE_CLIENT_ID,
    undefined,
    oidc.ClientSecretPost(env.GOOGLE_CLIENT_SECRET)
  );

  app.get('/auth/google', async (_req, reply) => {
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();

    // short-lived, httpOnly cookie for state/nonce
    reply.setCookie('oidc', JSON.stringify({ state, nonce }), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 300,
    });

    const url = oidc.buildAuthorizationUrl(config, {
      scope: 'openid email profile',
      redirect_uri: env.OAUTH_REDIRECT_URI,
      state,
      nonce,
    });

    return reply.redirect(url.href);
  });

  app.get('/auth/google/callback', async (req, reply) => {
    // validate query
    const Q = z.object({ code: z.string().min(1), state: z.string().min(1) });
    const q = Q.safeParse(req.query);
    if (!q.success) return reply.code(400).send({ error: 'invalid_query' });
    const { state } = q.data;

    // 2) read & validate temp cookie (state/nonce)
    const raw = req.cookies['oidc'];
    if (!raw) return reply.code(400).send({ error: 'missing_cookie' });

    let parsed: { state: string; nonce: string } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return reply.code(400).send({ error: 'bad_cookie' });
    }
    if (!parsed || parsed.state !== state) {
      reply.clearCookie('oidc', { path: '/' });
      return reply.code(400).send({ error: 'state_mismatch' });
    }

    const { nonce } = parsed;
    reply.clearCookie('oidc', { path: '/' });

    // exchange code → tokens, verify nonce, extract claims
    try {
      const currentUrl = new URL(req.raw.url!, env.URL);
      const tokens = await oidc.authorizationCodeGrant(
        config,
        currentUrl,
        { expectedState: state, expectedNonce: nonce, idTokenExpected: true },
        { redirect_uri: env.OAUTH_REDIRECT_URI }
      );

      const claims = tokens.claims?.();
      if (!claims?.sub) return reply.code(400).send({ error: 'missing_sub' });

      return reply.send({
        ok: true,
        sub: claims.sub,
        email: claims['email'],
        email_verified: claims['email_verified'],
        name: claims['name'],
        picture: claims['picture'],
      });
    } catch (err) {
      req.log.error({ err }, 'google_callback_exchange_failed');
      return reply.code(500).send({ error: 'oauth_exchange_failed' });
    }
  });
}
