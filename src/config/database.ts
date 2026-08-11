import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { env } from './env.js';

const { Pool } = pg;

const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

export const db = drizzle({ client: pool });
