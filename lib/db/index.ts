import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== 'production') {
  console.warn(
    'DATABASE_URL is not set — CP tracker routes will fail until it is configured.'
  );
}

const sql = neon(connectionString ?? '');

export const db = drizzle(sql, { schema });
