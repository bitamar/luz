import { env } from '../env.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const connectionString =
  process.env['NODE_ENV'] === 'test' ? env.TEST_DATABASE_URL : env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });
export const db = drizzle(pool, { schema });
