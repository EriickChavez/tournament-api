import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';

// Cierre manual del campeonato de una categoría. Con la categoría cerrada no se crean fases nuevas.
// Guarda quién fue el campeón al momento de cerrar.
export const categoryClosures = pgTable(
    'category_closures',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        // Se guarda también el torneo para listar los cierres de todo un torneo de una sola consulta.
        tournamentId: uuid('tournament_id')
            .notNull()
            .references(() => tournaments.id, { onDelete: 'cascade' }),
        categoryId: uuid('category_id')
            .notNull()
            .references(() => categories.id, { onDelete: 'cascade' }),
        championTeamId: uuid('champion_team_id').references(() => teams.id, {
            onDelete: 'set null',
        }),
        closedByUserId: uuid('closed_by_user_id').references(() => users.id),
        closedAt: timestamp('closed_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [uniqueIndex('category_closures_category_uidx').on(table.categoryId)],
);