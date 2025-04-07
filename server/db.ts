import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';

const { Pool } = pg;

// Check for database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize drizzle with the pool
export const db = drizzle(pool, { schema });