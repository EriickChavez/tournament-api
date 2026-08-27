import { pgTable, uuid, varchar, timestamp, unique } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema';
import { categories } from '../../../categories/infrastructure/database/schema';

export const teams = pgTable(
    'equipos',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('torneo_id')
            .notNull()
            .references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('categoria_id')
            .notNull()
            .references(() => categories.id),
        name: varchar('nombre', { length: 200 }).notNull(),
        abbreviation: varchar('siglas', { length: 50 }),
        logoUrl: varchar('logo_url', { length: 500 }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_equipos_torneo_nombre').on(table.tournamentId, table.name)],
);