import { pgTable, uuid, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { players } from '../../../players/infrastructure/database/schema.js';

export const teamStandings = pgTable(
    'posiciones',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('torneo_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('categoria_id').notNull().references(() => categories.id),
        teamId: uuid('equipo_id').notNull().references(() => teams.id),
        played: integer('pj').notNull().default(0),
        won: integer('pg').notNull().default(0),
        drawn: integer('pe').notNull().default(0),
        lost: integer('pp').notNull().default(0),
        goalsFor: integer('gf').notNull().default(0),
        goalsAgainst: integer('gc').notNull().default(0),
        goalDifference: integer('dg').notNull().default(0),
        points: integer('puntos').notNull().default(0),
        rank: integer('orden'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_posiciones').on(table.tournamentId, table.categoryId, table.teamId)],
);

export const topScorers = pgTable(
    'goleadores',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('torneo_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('categoria_id').notNull().references(() => categories.id),
        playerId: uuid('jugador_id').notNull().references(() => players.id),
        goals: integer('goles').notNull().default(0),
        assists: integer('asistencias').notNull().default(0),
        rank: integer('orden'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_goleadores').on(table.tournamentId, table.categoryId, table.playerId)],
);

export const cardCounts = pgTable(
    'tarjetas',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('torneo_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('categoria_id').notNull().references(() => categories.id),
        playerId: uuid('jugador_id').notNull().references(() => players.id),
        yellowCards: integer('amarillas').notNull().default(0),
        redCards: integer('rojas').notNull().default(0),
        rank: integer('orden'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_tarjetas').on(table.tournamentId, table.categoryId, table.playerId)],
);