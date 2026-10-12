import {
    pgTable,
    uuid,
    varchar,
    integer,
    timestamp,
    uniqueIndex,
    index,
    type AnyPgColumn,
} from 'drizzle-orm/pg-core';
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
    // Solo en 'cambio': jugador que entra (playerId es el que sale).
    substitutePlayerId: uuid('substitute_player_id').references(() => players.id),
    description: varchar('description', { length: 255 }),
    // Lo genera la app del árbitro por evento: un reintento no duplica el gol.
    clientEventId: uuid('client_event_id'),
    // Hora real del evento según el dispositivo (la hora del servidor es la de llegada).
    occurredAt: timestamp('occurred_at', { withTimezone: true }),
    // Evento generado por el sistema (roja por doble amarilla): se borra en cascada con su origen.
    derivedFromEventId: uuid('derived_from_event_id').references(
        (): AnyPgColumn => matchEvents.id,
        { onDelete: 'cascade' },
    ),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
},
    (t) => [
        uniqueIndex('match_events_match_client_event_uq').on(t.matchId, t.clientEventId),
        index('match_events_match_player_idx').on(t.matchId, t.playerId),
    ],
);