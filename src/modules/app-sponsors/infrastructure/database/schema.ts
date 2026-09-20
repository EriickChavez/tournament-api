import { boolean, date, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { superAdmins } from '../../../superadmins/infrastructure/database/schema.js';

export const appSponsors = pgTable('app_sponsors', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    logoUrl: varchar('logo_url', { length: 512 }).notNull(),
    logoStorageKey: varchar('logo_storage_key', { length: 512 }),
    websiteUrl: varchar('website_url', { length: 512 }),
    pdfUrl: varchar('pdf_url', { length: 512 }),
    pdfStorageKey: varchar('pdf_storage_key', { length: 512 }),
    order: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdByAdminId: uuid('created_by_admin_id').references(() => superAdmins.id),
    updatedByAdminId: uuid('updated_by_admin_id').references(() => superAdmins.id),
});