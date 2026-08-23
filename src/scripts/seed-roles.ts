import 'dotenv/config';
import { db, pool } from '../config/database.js';
import { roles } from '../modules/tournaments/infrastructure/database/schema.js';

const ROLE_NAMES = ['OWNER', 'ADMIN'] as const;

async function seedRoles(): Promise<void> {
    for (const name of ROLE_NAMES) {
        const [row] = await db
            .insert(roles)
            .values({ name })
            .onConflictDoNothing({ target: roles.name })
            .returning();

        if (row) {
            console.log(`Created role "${name}" with id ${row.id}`);
        } else {
            console.log(`Role "${name}" already exists, skipped`);
        }
    }

    await pool.end();
}

seedRoles().catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
});