import type { FastifyInstance } from 'fastify';
import * as oidc from 'openid-client';
import { env } from '../env.js';
import { z } from 'zod';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

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
      sameSite: 'none',
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

    // read & validate temp cookie (state/nonce)
    const raw = req.cookies['oidc'];
    if (!raw) return reply.code(400).send({ error: 'missing_cookie' });

    const Cookie = z.object({ state: z.string().min(1), nonce: z.string().min(1) });
    let parsed: { state: string; nonce: string } | null = null;
    try {
      const json = JSON.parse(raw);
      const c = Cookie.safeParse(json);
      if (!c.success) return reply.code(400).send({ error: 'bad_cookie' });
      parsed = c.data;
    } catch {
      return reply.code(400).send({ error: 'bad_cookie' });
    }
    if (parsed.state !== state) {
      reply.clearCookie('oidc', { path: '/' });
      return reply.code(400).send({ error: 'state_mismatch' });
    }

    const { nonce } = parsed;
    reply.clearCookie('oidc', { path: '/' });

    // exchange code → tokens, verify nonce, extract claims
    try {
      // Build the exact callback URL used for verification by combining the configured
      // redirect URI with the runtime query string received on this request.
      const currentUrl = new URL(env.OAUTH_REDIRECT_URI);
      const queryIndex = req.url.indexOf('?');
      currentUrl.search = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
      const tokens = await oidc.authorizationCodeGrant(
        config,
        currentUrl,
        { expectedState: state, expectedNonce: nonce, idTokenExpected: true },
        { redirect_uri: env.OAUTH_REDIRECT_URI }
      );

      const rawClaims = tokens.claims?.();
      if (!rawClaims) return reply.code(400).send({ error: 'missing_claims' });

      const Claims = z.object({
        sub: z.string().min(1),
        email: z.string().min(1),
        email_verified: z.boolean().optional(),
        name: z.string().optional().nullable(),
        picture: z.string().optional().nullable(),
      });

      const parsedClaims = Claims.safeParse(rawClaims);
      if (!parsedClaims.success) return reply.code(400).send({ error: 'invalid_claims' });

      const { sub, email, name, picture, email_verified } = parsedClaims.data;
      if (email_verified === false) return reply.code(400).send({ error: 'email_unverified' });

      const now = new Date();
      const [user] = await db
        .insert(users)
        .values({
          email,
          googleId: sub,
          name: name ?? null,
          avatarUrl: picture ?? null,
          updatedAt: now,
          lastLoginAt: now,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            googleId: sub,
            name: name ?? null,
            avatarUrl: picture ?? null,
            updatedAt: now,
            lastLoginAt: now,
          },
        })
        .returning();

      return reply.send({ ok: true, user });
    } catch (err) {
      req.log.error({ err }, 'google_callback_exchange_failed');
      return reply.code(500).send({ error: 'oauth_exchange_failed' });
    }
  });
}
