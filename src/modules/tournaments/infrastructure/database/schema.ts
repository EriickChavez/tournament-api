import { pgTable, uuid, varchar, text, date, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../../auth/infrastructure/database/schema.js';

export const tournaments = pgTable('torneos', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('nombre', { length: 200 }).notNull(),
    subtitle: varchar('subtitulo', { length: 255 }),
    description: text('descripcion'),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    startDate: date('fecha_inicio'),
    endDate: date('fecha_fin'),
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

export const tournamentMembers = pgTable('torneo_members', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('torneo_id').notNull().references(() => tournaments.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    roleId: uuid('role_id').notNull().references(() => roles.id),
    status: varchar('status', { length: 30 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
