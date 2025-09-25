import type { FastifyInstance } from 'fastify';
import * as oidc from 'openid-client';
import { env } from '../env.js';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance) {
  const config = await oidc.discovery(
    new URL('https://accounts.google.com'),
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET
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
    const Q = z.object({
      code: z.string().min(1),
      state: z.string().min(1),
    });
    const parseQuery = Q.safeParse(req.query);
    if (!parseQuery.success) return reply.code(400).send({ error: 'invalid_query' });

    const { code, state } = parseQuery.data;

    // read & validate cookie
    const raw = req.cookies['oidc'];
    if (!raw) return reply.code(400).send({ error: 'missing_cookie' });

    let parsed: { state: string; nonce: string } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return reply.code(400).send({ error: 'bad_cookie' });
    }
    if (!parsed || parsed.state !== state) {
      // clear the temp cookie on mismatch
      reply.clearCookie('oidc', { path: '/' });
      return reply.code(400).send({ error: 'state_mismatch' });
    }

    // keep nonce in memory for next step; clear temp cookie now
    const { nonce } = parsed;
    reply.clearCookie('oidc', { path: '/' });

    return reply.send({ ok: true, codeReceived: Boolean(code), noncePresent: Boolean(nonce) });
  });
}
