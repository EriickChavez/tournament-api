import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const superAdmins = pgTable('super_admins', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const superAdminSessions = pgTable('super_admin_sessions', {
    id: varchar('id', { length: 128 }).primaryKey(),
    superAdminId: uuid('super_admin_id')
        .notNull()
        .references(() => superAdmins.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});