import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/app.js';
import { resetDb } from '../utils/db.js';
import { injectAuthed } from '../utils/inject.js';
import { db } from '../../src/db/client.js';
import { users } from '../../src/db/schema.js';
import * as sessionModule from '../../src/auth/session.js';

vi.mock('openid-client', () => ({
  discovery: vi.fn().mockResolvedValue({}),
  ClientSecretPost: (secret: string) => ({ secret }),
  authorizationCodeGrant: vi.fn(),
}));

vi.mock('../../src/env.js', () => ({
  env: {
    APP_ORIGIN: 'http://localhost:5173',
    JWT_SECRET: 'x'.repeat(32),
    DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    TWILIO_SID: 'AC123456789012345678901234567890',
    TWILIO_AUTH_TOKEN: 'twilio-token',
    URL: 'http://localhost:3000',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_TIME_WINDOW: 1000,
    OAUTH_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
    NODE_ENV: 'test',
  },
}));

async function createAuthedUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [user] = await db
    .insert(users)
    .values({
      email: overrides.email ?? `user-${crypto.randomUUID()}@example.com`,
      name: overrides.name ?? 'Settings Tester',
      phone: overrides.phone ?? null,
    })
    .returning();

  const sessionId = `session-${crypto.randomUUID()}`;
  const now = new Date();
  vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
    id: sessionId,
    user,
    createdAt: now,
    lastAccessedAt: now,
  });

  return { user, sessionId };
}

describe('routes/users', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ logger: false });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await resetDb();
  });

  it('returns current user settings', async () => {
    const { user, sessionId } = await createAuthedUser({
      name: 'Ada Lovelace',
      phone: '050-1234567',
    });

    const res = await injectAuthed(app, sessionId, { method: 'GET', url: '/settings' });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { user: { id: string; name: string | null; phone: string | null } };
    expect(body.user).toMatchObject({ id: user.id, name: 'Ada Lovelace', phone: '050-1234567' });
  });

  it('updates user settings', async () => {
    const { user, sessionId } = await createAuthedUser({ name: 'Initial Name', phone: null });

    const res = await injectAuthed(app, sessionId, {
      method: 'PUT',
      url: '/settings',
      payload: { name: 'Updated Name', phone: '050-7654321' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { user: { id: string; name: string | null; phone: string | null } };
    expect(body.user).toMatchObject({ id: user.id, name: 'Updated Name', phone: '050-7654321' });

    const row = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.id, user.id),
    });
    expect(row?.name).toBe('Updated Name');
    expect(row?.phone).toBe('050-7654321');
  });

  it('returns conflict when phone number already exists', async () => {
    const { sessionId } = await createAuthedUser();

    const returningMock = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('duplicate'), { code: '23505' }));
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    const updateSpy = vi.spyOn(db, 'update').mockReturnValue({ set: setMock } as never);

    const res = await injectAuthed(app, sessionId, {
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      method: 'PUT',
      url: '/settings',
      payload: { phone: '050-1111111' },
    });

    updateSpy.mockRestore();

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: 'duplicate_phone' });
  });
});
