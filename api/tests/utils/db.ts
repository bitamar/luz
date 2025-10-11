import { URL } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
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
  if (process.env.NODE_ENV !== 'test') throw new Error('API tests must run with NODE_ENV="test"');

  const testUrl = env.TEST_DATABASE_URL;
  if (!testUrl) throw new Error('TEST_DATABASE_URL must be set when running API tests');

  return testUrl;
})();

const pool = new pg.Pool({ connectionString });
export const testDb = drizzle(pool, { schema });

function assertTestDatabase() {
  const url = new URL(connectionString);
  const dbName = url.pathname.substring(1);

  if (dbName === 'kalimere_test') return;

  throw new Error(`Refusing to reset non-test database "${dbName}".`);
}

export async function resetDb() {
  assertTestDatabase();

  try {
    // First try to delete using Drizzle ORM approach (which allows better type safety)
    await testDb.delete(visitTreatments);
    await testDb.delete(appointments);
    await testDb.delete(visits);
    await testDb.delete(pets);
    await testDb.delete(treatments);
    await testDb.delete(customers);
    await testDb.delete(sessions);
    await testDb.delete(users);
  } catch (error) {
    console.error('Error during standard database reset, trying with CASCADE:', error);

    // If there was an error, try to reset the database using raw SQL with CASCADE
    await testDb.execute(sql`DELETE FROM users CASCADE`);
  }
}

export async function createCustomer(data: { name: string }, userId: string) {
  assertTestDatabase();

  const [customer] = await testDb.insert(customers).values({ userId, name: data.name }).returning();
  return customer;
}
