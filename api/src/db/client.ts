import { env } from '../env.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const usePgMem = process.env.TEST_USE_PG_MEM === '1';

let pool: pg.Pool;

if (usePgMem) {
  const { preparePgMem, createPgMemPool } = await import('./pg-mem.js');
  preparePgMem();
  pool = createPgMemPool();
} else {
  const isTest = process.env['NODE_ENV'] === 'test';
  const connectionString = isTest ? process.env['TEST_DATABASE_URL'] : env.DATABASE_URL;

  if (!connectionString) throw new Error('Database connection string is not configured');

  pool = new pg.Pool({ connectionString });
}

let poolClosing = false;
let poolEnded = false;

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export async function closeDb() {
  if (poolClosing || poolEnded) return;
  poolClosing = true;
  try {
    await pool.end();
    poolEnded = true;
  } finally {
    poolClosing = false;
  }
}
