import 'dotenv/config';
import { afterAll } from 'vitest';

// Set consistent defaults for test env. Individual tests can override via module mocks when needed.
process.env.APP_ORIGIN = 'http://localhost:5173';
process.env.ALLOWED_APP_ORIGINS = 'localhost:5173';
process.env.JWT_SECRET = 'x'.repeat(32);
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
process.env.GOOGLE_CLIENT_ID = 'client-id';
process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
process.env.TWILIO_SID = 'AC123456789012345678901234567890';
process.env.TWILIO_AUTH_TOKEN = 'twilio-token';
process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+19000000000';
process.env.URL = 'http://localhost:3000';
process.env.RATE_LIMIT_MAX = '100';
process.env.RATE_LIMIT_TIME_WINDOW = '1000';

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
