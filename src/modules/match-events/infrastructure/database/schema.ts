import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { matches } from '../../../matches/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { players } from '../../../players/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';

export const matchEvents = pgTable('match_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id')
        .notNull()
        .references(() => tournaments.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
        .notNull()
        .references(() => categories.id),
    matchId: uuid('match_id')
        .notNull()
        .references(() => matches.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 30 }).notNull(),
    minute: integer('minute'),
    teamId: uuid('team_id')
        .notNull()
        .references(() => teams.id),
    playerId: uuid('player_id').references(() => players.id),
    assistedByPlayerId: uuid('assisted_by_player_id').references(() => players.id),
    description: varchar('description', { length: 255 }),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});