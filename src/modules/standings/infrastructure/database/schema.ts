import { pgTable, uuid, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { players } from '../../../players/infrastructure/database/schema.js';

export const teamStandings = pgTable(
    'team_standings',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('category_id').notNull().references(() => categories.id),
        teamId: uuid('team_id').notNull().references(() => teams.id),
        played: integer('played').notNull().default(0),
        won: integer('won').notNull().default(0),
        drawn: integer('drawn').notNull().default(0),
        lost: integer('lost').notNull().default(0),
        goalsFor: integer('goals_for').notNull().default(0),
        goalsAgainst: integer('goals_against').notNull().default(0),
        goalDifference: integer('goal_difference').notNull().default(0),
        points: integer('points').notNull().default(0),
        rank: integer('rank'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_team_standings').on(table.tournamentId, table.categoryId, table.teamId)],
);

export const topScorers = pgTable(
    'top_scorers',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('category_id').notNull().references(() => categories.id),
        playerId: uuid('player_id').notNull().references(() => players.id),
        goals: integer('goals').notNull().default(0),
        assists: integer('assists').notNull().default(0),
        rank: integer('rank'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_top_scorers').on(table.tournamentId, table.categoryId, table.playerId)],
);

export const cardCounts = pgTable(
    'card_counts',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('category_id').notNull().references(() => categories.id),
        playerId: uuid('player_id').notNull().references(() => players.id),
        yellowCards: integer('yellow_cards').notNull().default(0),
        redCards: integer('red_cards').notNull().default(0),
        rank: integer('rank'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_card_counts').on(table.tournamentId, table.categoryId, table.playerId)],
);