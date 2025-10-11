import type { FastifyInstance, InjectOptions } from 'fastify';
import { SESSION_COOKIE_NAME } from '../../src/auth/constants.js';
import { testDb } from './db.js';
import { sessions } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Injects a request with authentication cookies.
 * This function ensures that the session cookie is properly formatted and included in the request.
 * It also verifies that the session exists in the database before making the request.
 */
export async function injectAuthed(
  app: FastifyInstance,
  sessionId: string,
  options: InjectOptions
) {
  if (!sessionId) {
    console.warn('Warning: injectAuthed called with empty sessionId');
  }

  // Verify the session exists in the database
  const sessionExists = await testDb.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });

  if (!sessionExists) {
    console.warn(`Warning: Session ID ${sessionId} not found in database before request`);
  }

  // Format the cookie properly - exact format is crucial for authentication
  const cookieHeader = `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly`;

  // Merge with existing cookies if present
  const headers = {
    ...(options.headers ?? {}),
    cookie: options.headers?.cookie ? `${options.headers.cookie}; ${cookieHeader}` : cookieHeader,
  };

  return app.inject({
    ...options,
    headers,
  });
}
