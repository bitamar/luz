import type { FastifyInstance } from 'fastify';
import * as oidc from 'openid-client';
import { env } from '../env.js';
import { DrizzleUserRepository } from '../auth/repo.drizzle.js';
import { startGoogleAuth, finishGoogleAuth } from '../auth/service.js';

export async function authRoutes(app: FastifyInstance) {
  const config = await oidc.discovery(
    new URL('https://accounts.google.com'),
    env.GOOGLE_CLIENT_ID,
    undefined,
    oidc.ClientSecretPost(env.GOOGLE_CLIENT_SECRET)
  );

  app.get('/auth/google', async (_req, reply) => {
    const { cookie, redirectUrl } = startGoogleAuth(config, {
      redirectUri: env.OAUTH_REDIRECT_URI,
    });
    reply.setCookie(cookie.name, cookie.value, cookie.options);
    return reply.redirect(redirectUrl);
  });

  app.get('/auth/google/callback', async (req, reply) => {
    const repo = new DrizzleUserRepository();
    const result = await finishGoogleAuth(
      { config, repo, now: () => new Date(), redirectUri: env.OAUTH_REDIRECT_URI },
      { requestUrl: req.url, query: req.query, rawCookie: req.cookies['oidc'] }
    );

    // Clear temporary cookie regardless of outcome
    reply.clearCookie('oidc', { path: '/' });

    if (!result.ok) {
      const isServer = result.error === 'oauth_exchange_failed';
      if (isServer) {
        req.log.error({ error: result.error }, 'google_callback_exchange_failed');
        return reply.code(500).send({ error: result.error });
      }
      return reply.code(400).send({ error: result.error });
    }

    return reply.send({ ok: true, user: result.data.user });
  });
}
