import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
    query_timeout: 10_000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle Postgres client', err);
});

export const db = drizzle({ client: pool });