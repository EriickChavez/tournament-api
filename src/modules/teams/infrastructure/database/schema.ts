import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';

export const teams = pgTable(
    'teams',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('tournament_id')
            .notNull()
            .references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('category_id')
            .notNull()
            .references(() => categories.id),
        name: varchar('name', { length: 200 }).notNull(),
        abbreviation: varchar('abbreviation', { length: 50 }),
        logoUrl: varchar('logo_url', { length: 500 }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_teams_tournament_name').on(table.tournamentId, table.name)],
);