import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { resetDb } from '../utils/db.js';
import { db } from '../../src/db/client.js';
import { users } from '../../src/db/schema.js';
import {
  createTreatmentForUser,
  deleteTreatmentForUser,
  getTreatmentForUser,
  listTreatmentsForUser,
  updateTreatmentForUser,
} from '../../src/services/treatment-service.js';

async function createUser() {
  const [user] = await db
    .insert(users)
    .values({ email: `service-${crypto.randomUUID()}@example.com`, name: 'Service Tester' })
    .returning();
  return user;
}

describe('treatment-service', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  it('creates, retrieves, updates and deletes treatments for a user', async () => {
    const user = await createUser();

    const created = await createTreatmentForUser(user.id, {
      name: 'Initial Treatment',
      defaultIntervalMonths: null,
      price: null,
    });

    expect(created).toMatchObject({
      userId: user.id,
      name: 'Initial Treatment',
      defaultIntervalMonths: null,
      price: null,
    });

    const listAfterCreate = await listTreatmentsForUser(user.id);
    expect(listAfterCreate).toHaveLength(1);

    const updated = await updateTreatmentForUser(user.id, created.id, { price: 120 });
    expect(updated).toMatchObject({ price: 120 });

    const fetched = await getTreatmentForUser(user.id, created.id);
    expect(fetched).toMatchObject({ id: created.id, price: 120 });

    const deletionResult = await deleteTreatmentForUser(user.id, created.id);
    expect(deletionResult).toEqual({ ok: true });

    const listAfterDelete = await listTreatmentsForUser(user.id);
    expect(listAfterDelete).toEqual([]);
  });

  it('throws not found when accessing missing treatment', async () => {
    const user = await createUser();
    await expect(getTreatmentForUser(user.id, crypto.randomUUID())).rejects.toHaveProperty(
      'statusCode',
      404
    );
  });
});
