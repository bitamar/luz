import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../env.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const isTest = process.env['NODE_ENV'] === 'test';

function createPgMemPool(newDb: typeof import('pg-mem').newDb): pg.Pool {
  const mem = newDb({ autoCreateForeignKeyIndices: true });

  mem.public.registerFunction({
    name: 'gen_random_uuid',
    returns: 'uuid',
    implementation: randomUUID,
  });

  const migrationsDir = fileURLToPath(new URL('../../drizzle', import.meta.url));
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const contents = readFileSync(join(migrationsDir, file), 'utf8');
    const statements = contents
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      mem.public.none(statement);
    }
  }

  const adapter = mem.adapters.createPg();
  const Pool = adapter.Pool as unknown as typeof pg.Pool;
  return new Pool() as unknown as pg.Pool;
}

let pool: pg.Pool;

if (isTest) {
  const { newDb } = await import('pg-mem');
  pool = createPgMemPool(newDb);
} else {
  pool = new pg.Pool({ connectionString: env.DATABASE_URL });
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
