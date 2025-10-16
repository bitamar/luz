import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/app.js';
import { resetDb } from '../utils/db.js';
import { injectAuthed } from '../utils/inject.js';
import { db } from '../../src/db/client.js';
import { users } from '../../src/db/schema.js';
import * as sessionModule from '../../src/auth/session.js';
import * as treatmentService from '../../src/services/treatment-service.js';

vi.mock('openid-client', () => ({
  discovery: vi.fn().mockResolvedValue({}),
  ClientSecretPost: (secret: string) => ({ secret }),
  authorizationCodeGrant: vi.fn(),
}));

async function createAuthedUser() {
  const [user] = await db
    .insert(users)
    .values({ email: `treat-${crypto.randomUUID()}@example.com`, name: 'Treat Tester' })
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
    const missingId = crypto.randomUUID();

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

    const conflictError = Object.assign(new Error('duplicate'), { code: 'duplicate_name' });
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
});
