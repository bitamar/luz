import crypto from 'node:crypto';
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
  const parsed = new URL(connectionString);
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName === 'kalimere_test') return;

  throw new Error(
    `Refusing to reset non-test database "${dbName}". ` +
      'Point TEST_DATABASE_URL to a dedicated test database whose name includes "test" before running API tests.'
  );
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

    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error during standard database reset, trying with CASCADE:', error);

    // If the standard approach fails, try with raw SQL using CASCADE
    try {
      // Use raw SQL with CASCADE to forcibly clear tables
      await testDb.execute(
        sql`TRUNCATE TABLE 
        visit_treatments, appointments, visits, pets, treatments, 
        customers, sessions, users
        CASCADE`
      );

      console.log('Database reset with CASCADE completed successfully');
    } catch (cascadeError) {
      console.error('Error during CASCADE reset:', cascadeError);

      // Diagnostic info about what's still in the database
      try {
        const customersCount = await testDb.select({ count: sql`count(*)` }).from(customers);
        const sessionsCount = await testDb.select({ count: sql`count(*)` }).from(sessions);
        const usersCount = await testDb.select({ count: sql`count(*)` }).from(users);
        console.log('Remaining data counts:', {
          customers: customersCount[0]?.count ?? 0,
          sessions: sessionsCount[0]?.count ?? 0,
          users: usersCount[0]?.count ?? 0,
        });
      } catch (countError) {
        console.error('Error checking remaining data:', countError);
      }

      throw cascadeError;
    }
  }
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
