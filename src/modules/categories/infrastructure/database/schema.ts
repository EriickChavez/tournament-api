import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';

export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id')
        .notNull()
        .references(() => tournaments.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    minAge: integer('min_age'),
    maxAge: integer('max_age'),
    description: text('description'),
    order: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
});