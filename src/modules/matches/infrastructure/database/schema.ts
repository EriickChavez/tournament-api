import { pgTable, uuid, varchar, timestamp, integer, primaryKey, index } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { phases, phaseGroups } from '../../../phases/infrastructure/database/schema.js';

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
    phaseId: uuid('phase_id').references(() => phases.id, { onDelete: 'set null' }),
    phaseGroupId: uuid('phase_group_id').references(() => phaseGroups.id, {
        onDelete: 'set null',
    }),
    round: integer('round'),
    // Marcador opcional. Si ambos están definidos, mandan sobre los eventos de gol.
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    // Tanda de penales (solo eliminatoria): únicamente tiene sentido si el marcador queda empatado.
    homePenalties: integer('home_penalties'),
    awayPenalties: integer('away_penalties'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    venue: varchar('venue', { length: 200 }),
    status: varchar('status', { length: 30 }).notNull().default('scheduled'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Árbitros asignados a un partido. Sin filas = cualquier admin puede operar la cédula.
export const matchReferees = pgTable(
    'match_referees',
    {
        matchId: uuid('match_id')
            .notNull()
            .references(() => matches.id, { onDelete: 'cascade' }),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        assignedByUserId: uuid('assigned_by_user_id').references(() => users.id),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        primaryKey({ columns: [t.matchId, t.userId] }),
        index('match_referees_user_idx').on(t.userId),
    ],
);