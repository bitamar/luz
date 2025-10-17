import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
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

let cachedConnectionString: string | undefined;
let pool: pg.Pool | undefined;
let testDbInstance: NodePgDatabase<typeof schema> | undefined;
let poolClosing = false;

function resolveConnectionString() {
  if (cachedConnectionString) return cachedConnectionString;

  if (process.env.NODE_ENV !== 'test') throw new Error('API tests must run with NODE_ENV="test"');

  const testUrl = env.TEST_DATABASE_URL ?? process.env.TEST_DATABASE_URL;
  if (!testUrl) throw new Error('TEST_DATABASE_URL must be set when running API tests');

  cachedConnectionString = testUrl;
  return cachedConnectionString;
}

function getPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: resolveConnectionString() });
  }
  return pool;
}

function getTestDb() {
  if (!testDbInstance) {
    testDbInstance = drizzle(getPool(), { schema });
  }
  return testDbInstance;
}

function assertTestDatabase() {
  const parsed = new URL(resolveConnectionString());
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName.includes('test')) return;

  throw new Error(
    `Refusing to reset non-test database "${dbName}". ` +
      'Point TEST_DATABASE_URL to a dedicated test database whose name includes "test" before running API tests.'
  );
}

export async function resetDb() {
  assertTestDatabase();
  const db = getTestDb();
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
  const db = getTestDb();
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        email: `tester-${randomUUID()}@example.com`,
        name: 'Test User',
      })
      .returning();

    const now = new Date();
    const [session] = await tx
      .insert(sessions)
      .values({
        id: randomUUID(),
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
  const db = getTestDb();
  const [customer] = await db.insert(customers).values({ userId, name: data.name }).returning();
  return customer;
}

export async function seedPet(customerId: string, data: { name: string; type?: 'dog' | 'cat' }) {
  const db = getTestDb();
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
  if (!pool || poolClosing) return;
  poolClosing = true;
  try {
    await pool.end();
    pool = undefined;
    testDbInstance = undefined;
    cachedConnectionString = undefined;
  } finally {
    poolClosing = false;
  }
}
