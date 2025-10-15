import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newDb, type IMemoryDb } from 'pg-mem';
import type pg from 'pg';

let memoryDb: IMemoryDb | undefined;
let adapter: ReturnType<IMemoryDb['adapters']['createPg']> | undefined;

function ensurePrepared() {
  if (memoryDb) return;

  const db = newDb({ autoCreateForeignKeyIndices: true });

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: 'uuid',
    implementation: () => crypto.randomUUID(),
  });

  const migrationPath = join(process.cwd(), 'drizzle', '0000_purple_scourge.sql');
  const sql = readFileSync(migrationPath, 'utf8');
  sql
    .split('--> statement-breakpoint')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((statement) => db.public.none(statement));

  memoryDb = db;
  adapter = db.adapters.createPg();
}

export function preparePgMem() {
  ensurePrepared();
}

export function createPgMemPool(): pg.Pool {
  ensurePrepared();
  if (!adapter) throw new Error('pg-mem adapter was not initialised');
  const { Pool } = adapter;
  return new Pool() as unknown as pg.Pool;
}
