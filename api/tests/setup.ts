import 'dotenv/config';
import { afterAll } from 'vitest';

const testConnectionString = process.env.TEST_DATABASE_URL;

if (!testConnectionString) throw new Error('TEST_DATABASE_URL is not set.');

if (!testConnectionString.toLowerCase().includes('test')) {
  throw new Error(
    `TEST_DATABASE_URL must point to a database whose name includes "test". Received "${testConnectionString}".`
  );
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL === testConnectionString) {
  throw new Error(
    'TEST_DATABASE_URL must not be the same as DATABASE_URL; using the same database risks wiping development data.'
  );
}

afterAll(async () => {
  const tasks: Array<Promise<unknown>> = [];

  try {
    const { closeDb } = await import('../src/db/client.js');
    tasks.push(closeDb());
  } catch {
    // Ignore: DB client was never initialised.
  }

  try {
    const { closeTestDb } = await import('./utils/db.js');
    tasks.push(closeTestDb());
  } catch {
    // Ignore: test helpers were never used.
  }

  if (tasks.length > 0) await Promise.allSettled(tasks);
});
