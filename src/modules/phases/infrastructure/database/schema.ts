import { pgTable, uuid, varchar, integer, date, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';

export const phases = pgTable('phases', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id')
        .notNull()
        .references(() => tournaments.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
        .notNull()
        .references(() => categories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    type: varchar('type', { length: 30 }).notNull(), // group | knockout | league
    status: varchar('status', { length: 30 }).notNull().default('upcoming'), // upcoming | active | finished
    sortOrder: integer('sort_order').notNull().default(0),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const phaseGroups = pgTable('phase_groups', {
    id: uuid('id').primaryKey().defaultRandom(),
    phaseId: uuid('phase_id')
        .notNull()
        .references(() => phases.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const phaseTeams = pgTable(
    'phase_teams',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        phaseId: uuid('phase_id')
            .notNull()
            .references(() => phases.id, { onDelete: 'cascade' }),
        teamId: uuid('team_id')
            .notNull()
            .references(() => teams.id, { onDelete: 'cascade' }),
        phaseGroupId: uuid('phase_group_id').references(() => phaseGroups.id, {
            onDelete: 'set null',
        }),
        seed: integer('seed'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [uniqueIndex('phase_teams_phase_team_uidx').on(table.phaseId, table.teamId)],
);