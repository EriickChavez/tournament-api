import { boolean, date, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { superAdmins } from '../../../superadmins/infrastructure/database/schema.js';

// Patrocinadores de la app en general — sin torneo_id, nunca se mezclan con
// los patrocinadores de un torneo (esos van en su propia tabla, aparte).
export const appSponsors = pgTable('patrocinadores_app', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('nombre', { length: 200 }).notNull(),
    description: varchar('descripcion', { length: 500 }).notNull(),
    logoUrl: varchar('logo_url', { length: 512 }).notNull(),
    logoStorageKey: varchar('logo_storage_key', { length: 512 }),
    websiteUrl: varchar('website_url', { length: 512 }),
    pdfUrl: varchar('pdf_url', { length: 512 }),
    pdfStorageKey: varchar('pdf_storage_key', { length: 512 }),
    order: integer('orden').notNull().default(0),
    isActive: boolean('activo').notNull().default(true),
    startDate: date('fecha_inicio'),
    endDate: date('fecha_fin'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdByAdminId: uuid('created_by_admin_id').references(() => superAdmins.id),
    updatedByAdminId: uuid('updated_by_admin_id').references(() => superAdmins.id),
});