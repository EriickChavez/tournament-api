import { and, asc, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { appSponsors } from './schema.js';
import type { AppSponsorRepository } from '../../domain/repositories/app-sponsor.repository.js';
import type { AppSponsor } from '../../domain/entities/app-sponsor.entity.js';

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export class DrizzleAppSponsorRepository implements AppSponsorRepository {
    async findById(id: string): Promise<AppSponsor | null> {
        const [row] = await db.select().from(appSponsors).where(eq(appSponsors.id, id)).limit(1);
        return row ?? null;
    }

    async listAll(): Promise<AppSponsor[]> {
        return db
            .select()
            .from(appSponsors)
            .orderBy(asc(appSponsors.order), asc(appSponsors.createdAt));
    }

    async listPublic(now: Date): Promise<AppSponsor[]> {
        const today = toIsoDate(now);
        return db
            .select()
            .from(appSponsors)
            .where(
                and(
                    eq(appSponsors.isActive, true),
                    or(isNull(appSponsors.startDate), lte(appSponsors.startDate, today)),
                    or(isNull(appSponsors.endDate), gte(appSponsors.endDate, today)),
                ),
            )
            .orderBy(asc(appSponsors.order), asc(appSponsors.createdAt));
    }

    async create(input: {
        name: string;
        description: string;
        logoUrl: string;
        logoStorageKey: string | null;
        websiteUrl?: string | null | undefined;
        pdfUrl?: string | null | undefined;
        pdfStorageKey?: string | null | undefined;
        order?: number | undefined;
        isActive?: boolean | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
        createdByAdminId: string;
    }): Promise<AppSponsor> {
        const [row] = await db
            .insert(appSponsors)
            .values({
                name: input.name,
                description: input.description,
                logoUrl: input.logoUrl,
                logoStorageKey: input.logoStorageKey,
                websiteUrl: input.websiteUrl ?? null,
                pdfUrl: input.pdfUrl ?? null,
                pdfStorageKey: input.pdfStorageKey ?? null,
                order: input.order ?? 0,
                isActive: input.isActive ?? true,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
                createdByAdminId: input.createdByAdminId,
                updatedByAdminId: input.createdByAdminId,
            })
            .returning();

        if (!row) throw new Error('Failed to create app sponsor');
        return row;
    }

    async update(
        id: string,
        input: {
            name?: string | undefined;
            description?: string | undefined;
            logoUrl?: string | undefined;
            logoStorageKey?: string | null | undefined;
            websiteUrl?: string | null | undefined;
            pdfUrl?: string | null | undefined;
            pdfStorageKey?: string | null | undefined;
            order?: number | undefined;
            isActive?: boolean | undefined;
            startDate?: string | null | undefined;
            endDate?: string | null | undefined;
            updatedByAdminId: string;
        },
    ): Promise<AppSponsor> {
        const [row] = await db
            .update(appSponsors)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(eq(appSponsors.id, id))
            .returning();

        if (!row) throw new Error('Failed to update app sponsor');
        return row;
    }

    async delete(id: string): Promise<void> {
        const [row] = await db.delete(appSponsors).where(eq(appSponsors.id, id)).returning();
        if (!row) throw new Error('Failed to delete app sponsor');
    }
}