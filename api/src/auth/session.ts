import crypto from 'node:crypto';
import type { DbUser } from './types.js';

export const SESSION_COOKIE_NAME = 'session' as const;
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export interface SessionData {
  id: string;
  user: DbUser;
  createdAt: Date;
  lastAccessedAt: Date;
}

const sessions = new Map<string, SessionData>();

export function createSession(user: DbUser): SessionData {
  const id = crypto.randomUUID();
  const now = new Date();
  const data: SessionData = { id, user, createdAt: now, lastAccessedAt: now };
  sessions.set(id, data);
  return data;
}

export function getSession(sessionId: string | undefined): SessionData | undefined {
  if (!sessionId) return undefined;
  const data = sessions.get(sessionId);
  if (!data) return undefined;
  data.lastAccessedAt = new Date();
  return data;
}

export function deleteSession(sessionId: string | undefined): void {
  if (!sessionId) return;
  sessions.delete(sessionId);
}
