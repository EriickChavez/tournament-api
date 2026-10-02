import { pgTable, uuid, varchar, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { phases } from '../../../phases/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { matches } from '../../../matches/infrastructure/database/schema.js';

// Un nodo del cuadro de eliminación. Guarda sus equipos (cuando ya se conocen) y de dónde
// viene cada uno, para que el ganador pueda avanzar solo hasta la final.
export const phaseBracketNodes = pgTable(
    'phase_bracket_nodes',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        phaseId: uuid('phase_id')
            .notNull()
            .references(() => phases.id, { onDelete: 'cascade' }),
        // play_in = repechaje; main = cuadro principal; third_place = partido por el tercer lugar.
        stage: varchar('stage', { length: 20 }).notNull(),
        // play_in: 0. main: 1 = primera ronda. third_place: la misma ronda que la final.
        round: integer('round').notNull(),
        // Orden dentro de la ronda, desde 0.
        position: integer('position').notNull(),
        homeTeamId: uuid('home_team_id').references(() => teams.id, { onDelete: 'set null' }),
        awayTeamId: uuid('away_team_id').references(() => teams.id, { onDelete: 'set null' }),
        homeSeed: integer('home_seed'),
        awaySeed: integer('away_seed'),
        // Origen del equipo local/visitante cuando aún no se conoce: ganador o perdedor de otro nodo.
        homeSourceNodeId: uuid('home_source_node_id').references(
            (): AnyPgColumn => phaseBracketNodes.id,
            { onDelete: 'set null' },
        ),
        homeSourceKind: varchar('home_source_kind', { length: 10 }), // winner | loser
        awaySourceNodeId: uuid('away_source_node_id').references(
            (): AnyPgColumn => phaseBracketNodes.id,
            { onDelete: 'set null' },
        ),
        awaySourceKind: varchar('away_source_kind', { length: 10 }), // winner | loser
        // Se llena cuando el admin programa el partido (la fecha es obligatoria en matches).
        matchId: uuid('match_id').references(() => matches.id, { onDelete: 'set null' }),
        winnerTeamId: uuid('winner_team_id').references(() => teams.id, { onDelete: 'set null' }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('phase_bracket_nodes_slot_uidx').on(
            table.phaseId,
            table.stage,
            table.round,
            table.position,
        ),
    ],
);