import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import * as sessionModule from '../../src/auth/session.js';
import * as treatmentService from '../../src/services/treatment-service.js';
import { buildServer } from '../../src/app.js';
import { resetDb } from '../utils/db.js';
import { injectAuthed } from '../utils/inject.js';
import { db } from '../../src/db/client.js';
import { users } from '../../src/db/schema.js';
import { conflict } from '../../src/lib/app-error.js';

vi.mock('openid-client', () => ({
  discovery: vi.fn().mockResolvedValue({}),
  ClientSecretPost: (secret: string) => ({ secret }),
  authorizationCodeGrant: vi.fn(),
}));

type TestSession = NonNullable<Awaited<ReturnType<typeof sessionModule.getSession>>>;

const sessionStore = new Map<string, TestSession>();

function ensureSessionMock() {
  if (!vi.isMockFunction(sessionModule.getSession)) {
    vi.spyOn(sessionModule, 'getSession').mockImplementation(async (sessionId: string) => {
      return sessionStore.get(sessionId);
    });
  }
}

async function createAuthedUser() {
  const [user] = await db
    .insert(users)
    .values({ email: `treat-${randomUUID()}@example.com`, name: 'Treat Tester' })
    .returning();

  const sessionId = `session-${randomUUID()}`;
  const now = new Date();
  ensureSessionMock();
  const session: TestSession = {
    id: sessionId,
    user,
    createdAt: now,
    lastAccessedAt: now,
  };
  sessionStore.set(sessionId, session);

  return { user, sessionId };
}

describe('routes/treatments', () => {
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
    sessionStore.clear();
    await resetDb();
  });

  it('creates, lists, updates and soft deletes treatments', async () => {
    const { sessionId } = await createAuthedUser();

    const createRes = await injectAuthed(app, sessionId, {
      method: 'POST',
      url: '/treatments',
      payload: { name: 'Checkup', price: 80 },
    });
    expect(createRes.statusCode).toBe(201);
    const created = createRes.json() as { treatment: { id: string } };

    const listRes = await injectAuthed(app, sessionId, { method: 'GET', url: '/treatments' });
    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json() as { treatments: Array<Record<string, unknown>> };
    expect(listBody.treatments).toHaveLength(1);

    const getRes = await injectAuthed(app, sessionId, {
      method: 'GET',
      url: `/treatments/${created.treatment.id}`,
    });
    expect(getRes.statusCode).toBe(200);

    const updateRes = await injectAuthed(app, sessionId, {
      method: 'PUT',
      url: `/treatments/${created.treatment.id}`,
      payload: { price: 120 },
    });
    expect(updateRes.statusCode).toBe(200);
    const updateBody = updateRes.json() as { treatment: { price: number } };
    expect(updateBody.treatment.price).toBe(120);

    const deleteRes = await injectAuthed(app, sessionId, {
      method: 'DELETE',
      url: `/treatments/${created.treatment.id}`,
    });
    expect(deleteRes.statusCode).toBe(200);

    const listAfterDelete = await injectAuthed(app, sessionId, {
      method: 'GET',
      url: '/treatments',
    });
    const afterBody = listAfterDelete.json() as { treatments: unknown[] };
    expect(afterBody.treatments).toEqual([]);
  });

  it('returns 404 when updating non-existent treatment', async () => {
    const { sessionId } = await createAuthedUser();
    const missingId = randomUUID();

    const res = await injectAuthed(app, sessionId, {
      method: 'PUT',
      url: `/treatments/${missingId}`,
      payload: { name: 'Updated' },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: 'not_found' });
  });

  it('returns conflict when creating duplicate treatment name', async () => {
    const { sessionId } = await createAuthedUser();

    const conflictError = conflict({ code: 'duplicate_name' });
    vi.spyOn(treatmentService, 'createTreatmentForUser').mockRejectedValue(conflictError);

    const res = await injectAuthed(app, sessionId, {
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      url: '/treatments',
      payload: { name: 'Duplicate' },
    });

    vi.restoreAllMocks();

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: 'duplicate_name' });
  });

  it('allows different users to create treatments with the same name', async () => {
    const first = await createAuthedUser();
    const second = await createAuthedUser();

    const createFirst = await injectAuthed(app, first.sessionId, {
      method: 'POST',
      url: '/treatments',
      payload: { name: 'Shared Name', price: 50 },
    });
    expect(createFirst.statusCode).toBe(201);
    const firstBody = createFirst.json() as { treatment: { id: string; userId: string } };
    expect(firstBody.treatment.userId).toBe(first.user.id);

    const createSecond = await injectAuthed(app, second.sessionId, {
      method: 'POST',
      url: '/treatments',
      payload: { name: 'Shared Name', price: 60 },
    });
    expect(createSecond.statusCode).toBe(201);
    const secondBody = createSecond.json() as { treatment: { id: string; userId: string } };
    expect(secondBody.treatment.userId).toBe(second.user.id);
    expect(secondBody.treatment.id).not.toBe(firstBody.treatment.id);
  });
});
