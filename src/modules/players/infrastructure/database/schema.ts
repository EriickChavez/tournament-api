import {
    pgTable,
    uuid,
    varchar,
    integer,
    date,
    boolean,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';

export const players = pgTable(
    'jugadores',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tournamentId: uuid('torneo_id')
            .notNull()
            .references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('categoria_id')
            .notNull()
            .references(() => categories.id),
        firstName: varchar('nombre', { length: 120 }).notNull(),
        lastName: varchar('apellido', { length: 120 }).notNull(),
        birthDate: date('fecha_nacimiento'),
        number: integer('numero'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [unique('uq_jugadores_torneo_numero').on(table.tournamentId, table.number)],
);

export const teamPlayers = pgTable('equipo_jugador', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('torneo_id')
        .notNull()
        .references(() => tournaments.id, { onDelete: 'cascade' }),
    teamId: uuid('equipo_id')
        .notNull()
        .references(() => teams.id, { onDelete: 'cascade' }),
    playerId: uuid('jugador_id')
        .notNull()
        .references(() => players.id, { onDelete: 'cascade' }),
    role: varchar('rol', { length: 50 }),
    isCaptain: boolean('es_capitan').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
});