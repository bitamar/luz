import crypto from 'node:crypto';
import type { DbUser } from './types.js';
import { db } from '../db/client.js';
import { sessions as sessionsTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { SESSION_TTL } from './constants.js';

export interface SessionData {
  id: string;
  user: DbUser;
  createdAt: Date;
  lastAccessedAt: Date;
}

export function createSession(user: DbUser): SessionData {
  const id = crypto.randomUUID();
  const now = new Date();
  const data: SessionData = { id, user, createdAt: now, lastAccessedAt: now };
  // Persist to DB (fire and forget)
  const expiresAt = new Date(now.getTime() + 1000 * SESSION_TTL);
  db.insert(sessionsTable)
    .values({ id, userId: user.id, createdAt: now, lastAccessedAt: now, expiresAt })
    .catch(() => {});
  return data;
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

export function deleteSession(sessionId: string | undefined): void {
  if (!sessionId) return;
  db.delete(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .catch(() => {});
}
