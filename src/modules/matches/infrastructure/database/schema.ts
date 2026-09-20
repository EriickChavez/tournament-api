import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';

export const matches = pgTable('matches', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id')
        .notNull()
        .references(() => tournaments.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
        .notNull()
        .references(() => categories.id),
    homeTeamId: uuid('home_team_id')
        .notNull()
        .references(() => teams.id),
    awayTeamId: uuid('away_team_id')
        .notNull()
        .references(() => teams.id),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    venue: varchar('venue', { length: 200 }),
    status: varchar('status', { length: 30 }).notNull().default('scheduled'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});