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
        // Fase de grupos de la que salieron los clasificados. Sirve para impedir reabrir esa fase
        // mientras exista la llave. Es el mismo valor en todos los nodos de una llave.
        sourcePhaseId: uuid('source_phase_id').references(() => phases.id, {
            onDelete: 'set null',
        }),
        // play_in = repechaje; main = cuadro principal; third_place = partido por el tercer lugar.
        stage: varchar('stage', { length: 20 }).notNull(),
        // play_in: 0. main: 1 = primera ronda. third_place: la misma ronda que la final.
        round: integer('round').notNull(),
        // Orden dentro de la ronda, desde 0.
        position: integer('position').notNull(),
        // 1 = partido único; 2 = ida y vuelta. Se decide al generar la llave.
        legs: integer('legs').notNull().default(1),
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
        // Partido de ida (o el único). Se llena cuando el admin lo programa (la fecha es obligatoria en matches).
        matchId: uuid('match_id').references(() => matches.id, { onDelete: 'set null' }),
        // Partido de vuelta (solo si legs = 2). En él, el local es el visitante del cruce.
        secondLegMatchId: uuid('second_leg_match_id').references(() => matches.id, {
            onDelete: 'set null',
        }),
        // Penales del cruce a dos partidos (respecto a home/away del nodo). En partido único los
        // penales viven en el propio partido.
        homePenalties: integer('home_penalties'),
        awayPenalties: integer('away_penalties'),
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