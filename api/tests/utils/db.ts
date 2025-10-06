import crypto from 'node:crypto';
import { URL } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../src/db/schema.js';
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
import { env } from '../../src/env.js';

const connectionString = (() => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('API tests must run with NODE_ENV="test"');
  }

  const testUrl = env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL must be set when running API tests');
  }

  return testUrl;
})();

const pool = new pg.Pool({ connectionString });
export const testDb = drizzle(pool, { schema });

function assertTestDatabase() {
  const parsed = new URL(connectionString);
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName === 'kalimere_test' || dbName.toLowerCase().includes('test')) {
    return;
  }

  throw new Error(
    `Refusing to reset non-test database "${dbName}". ` +
      'Point TEST_DATABASE_URL to a dedicated test database whose name includes "test" before running API tests.'
  );
}

export async function resetDb() {
  assertTestDatabase();
  await testDb.delete(visitTreatments);
  await testDb.delete(appointments);
  await testDb.delete(visits);
  await testDb.delete(pets);
  await testDb.delete(treatments);
  await testDb.delete(customers);
  await testDb.delete(sessions);
  await testDb.delete(users);
}

export async function createTestUserWithSession() {
  const [user] = await testDb
    .insert(users)
    .values({
      email: `tester-${Date.now()}@example.com`,
      name: 'Test User',
    })
    .returning();

  const now = new Date();
  const [session] = await testDb
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
}

export async function seedCustomer(userId: string, data: { name: string }) {
  const [customer] = await testDb.insert(customers).values({ userId, name: data.name }).returning();
  return customer;
}
