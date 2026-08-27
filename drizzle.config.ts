import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: [
        './src/modules/auth/infrastructure/database/schema.ts',
        './src/modules/tournaments/infrastructure/database/schema.ts',
        './src/modules/categories/infrastructure/database/schema.ts',
    ],
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
