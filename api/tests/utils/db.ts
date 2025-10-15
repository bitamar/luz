import crypto from 'node:crypto';
import { URL } from 'node:url';
import {
  appointments,
  customers,
  pets,
  sessions,
  users,
  visitTreatments,
  visits,
  treatments,
} from '../../src/db/schema.js';
import { db, closeDb } from '../../src/db/client.js';
import { env } from '../../src/env.js';

const usePgMem = process.env.TEST_USE_PG_MEM === '1';

function assertTestDatabase() {
  if (usePgMem) return;
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('API tests must run with NODE_ENV="test"');
  }

  const testUrl = env.TEST_DATABASE_URL ?? process.env.TEST_DATABASE_URL;
  if (!testUrl) throw new Error('TEST_DATABASE_URL must be set when running API tests');

  const parsed = new URL(testUrl);
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName.includes('test')) return;

  throw new Error(
    `Refusing to reset non-test database "${dbName}". ` +
      'Point TEST_DATABASE_URL to a dedicated test database whose name includes "test" before running API tests.'
  );
}

export async function resetDb() {
  assertTestDatabase();
  await db.delete(visitTreatments);
  await db.delete(appointments);
  await db.delete(visits);
  await db.delete(pets);
  await db.delete(treatments);
  await db.delete(customers);
  await db.delete(sessions);
  await db.delete(users);
}

export async function createTestUserWithSession() {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        email: `tester-${crypto.randomUUID()}@example.com`,
        name: 'Test User',
      })
      .returning();

    const now = new Date();
    const [session] = await tx
      .insert(sessions)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        createdAt: now,
        lastAccessedAt: now,
        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24),
      })
      .returning();

    return { user, session };
  });
}

export async function seedCustomer(userId: string, data: { name: string }) {
  const [customer] = await db.insert(customers).values({ userId, name: data.name }).returning();
  return customer;
}

export async function seedPet(customerId: string, data: { name: string; type?: 'dog' | 'cat' }) {
  const [pet] = await db
    .insert(pets)
    .values({
      customerId,
      name: data.name,
      type: data.type ?? 'dog',
      gender: 'male',
    })
    .returning();
  return pet;
}

export async function closeTestDb() {
  await closeDb();
}
