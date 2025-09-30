import type { FastifyInstance } from 'fastify';
import * as oidc from 'openid-client';
import { env } from '../env.js';
import { DrizzleUserRepository } from '../auth/repo.drizzle.js';
import { startGoogleAuth, finishGoogleAuth } from '../auth/service.js';
import {
  OIDC_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from '../auth/constants.js';
import { createSession, deleteSession, getSession } from '../auth/session.js';

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
    reply.clearCookie(OIDC_COOKIE_NAME, { path: '/' });

    if (!result.ok) {
      const isServer = result.error === 'oauth_exchange_failed';
      if (isServer) {
        req.log.error({ error: result.error }, 'google_callback_exchange_failed');
        return reply.code(500).send({ error: result.error });
      }
      const status = result.error === 'email_unverified' ? 403 : 400;
      req.log.debug({ error: result.error }, 'google_callback_client_error');
      return reply.code(status).send({ error: result.error });
    }

    // Create session and set cookie
    const session = createSession(result.data.user);
    reply.setCookie(SESSION_COOKIE_NAME, session.id, SESSION_COOKIE_OPTIONS);

    // On success, redirect back to the SPA (dashboard)
    return reply.redirect(`${env.APP_ORIGIN}/`);
  });

  // Return current user from session
  app.get('/me', async (req, reply) => {
    const sessionId = req.cookies[SESSION_COOKIE_NAME];
    const session = await getSession(sessionId);
    if (!session) return reply.code(401).send({ error: 'unauthorized' });
    return reply.send({ user: session.user });
  });

  // Logout: delete session and clear cookie
  app.post('/auth/logout', async (req, reply) => {
    const sessionId = req.cookies[SESSION_COOKIE_NAME];
    deleteSession(sessionId);
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return reply.send({ ok: true });
  });
}
