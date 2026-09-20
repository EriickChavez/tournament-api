import { pgTable, uuid, varchar, text, date, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from '../../../auth/infrastructure/database/schema.js';

export const tournaments = pgTable('tournaments', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    subtitle: varchar('subtitle', { length: 255 }),
    description: text('description'),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    startDate: date('start_date'),
    endDate: date('end_date'),
    timezone: varchar('timezone', { length: 60 }).notNull().default('America/Mexico_City'),
    maxSponsors: integer('max_sponsors').notNull().default(0),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 60 }).notNull().unique(),
    description: varchar('description', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentMembers = pgTable('tournament_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    roleId: uuid('role_id').notNull().references(() => roles.id),
    status: varchar('status', { length: 30 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});