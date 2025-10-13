import crypto from 'node:crypto';
import type { DbUser, SessionData } from './types.js';
import { db } from '../db/client.js';
import { eq } from 'drizzle-orm';
import { sessions as sessionsTable } from '../db/schema.js';
import { SESSION_TTL } from './constants.js';

export async function createSession(user: DbUser): Promise<SessionData> {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * SESSION_TTL);
  await db
    .insert(sessionsTable)
    .values({ id, userId: user.id, createdAt: now, lastAccessedAt: now, expiresAt });

  return { id, user, createdAt: now, lastAccessedAt: now };
}

export async function getSession(sessionId: string | undefined): Promise<SessionData | undefined> {
  if (!sessionId) return undefined;

  const row = await db.query.sessions.findFirst({
    where: eq(sessionsTable.id, sessionId),
    with: { user: true },
  });
  if (!row || !row.user) return undefined;
  const now = new Date();
  if (row.expiresAt <= now) {
    // Expired: delete and return undefined
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
    return undefined;
  }
  const data: SessionData = {
    id: row.id,
    user: row.user,
    createdAt: row.createdAt,
    lastAccessedAt: now,
  };
  // Rolling update
  await db
    .update(sessionsTable)
    .set({ lastAccessedAt: now })
    .where(eq(sessionsTable.id, sessionId));
  return data;
}

export async function deleteSession(sessionId: string | undefined): Promise<void> {
  if (!sessionId) return;
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}
