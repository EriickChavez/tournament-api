import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';

export const tournamentBranding = pgTable('torneo_branding', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('torneo_id')
        .notNull()
        .unique()
        .references(() => tournaments.id, { onDelete: 'cascade' }),
    logoUrl: varchar('logo_url', { length: 512 }),
    bannerUrl: varchar('banner_url', { length: 512 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
});