import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';

export const categories = pgTable('categorias', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('torneo_id')
        .notNull()
        .references(() => tournaments.id, { onDelete: 'cascade' }),
    title: varchar('titulo', { length: 200 }).notNull(),
    minAge: integer('edades_min'),
    maxAge: integer('edades_max'),
    description: text('descripcion'),
    order: integer('orden').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
});
