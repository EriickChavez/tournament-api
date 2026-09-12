import { and, asc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { tournamentSponsors } from './schema.js';
import type { TournamentSponsorRepository } from '../../domain/repositories/tournament-sponsor.repository.js';
import type { TournamentSponsor } from '../../domain/entities/tournament-sponsor.entity.js';

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export class DrizzleTournamentSponsorRepository implements TournamentSponsorRepository {
    async findById(id: string): Promise<TournamentSponsor | null> {
        const [row] = await db
            .select()
            .from(tournamentSponsors)
            .where(eq(tournamentSponsors.id, id))
            .limit(1);
        return row ?? null;
    }

    async listByTournament(tournamentId: string): Promise<TournamentSponsor[]> {
        return db
            .select()
            .from(tournamentSponsors)
            .where(eq(tournamentSponsors.tournamentId, tournamentId))
            .orderBy(asc(tournamentSponsors.order), asc(tournamentSponsors.createdAt));
    }

    async listPublicByTournament(tournamentId: string, now: Date): Promise<TournamentSponsor[]> {
        const today = toIsoDate(now);
        return db
            .select()
            .from(tournamentSponsors)
            .where(
                and(
                    eq(tournamentSponsors.tournamentId, tournamentId),
                    eq(tournamentSponsors.isActive, true),
                    or(isNull(tournamentSponsors.startDate), lte(tournamentSponsors.startDate, today)),
                    or(isNull(tournamentSponsors.endDate), gte(tournamentSponsors.endDate, today)),
                ),
            )
            .orderBy(asc(tournamentSponsors.order), asc(tournamentSponsors.createdAt));
    }

    async countByTournament(tournamentId: string): Promise<number> {
        const [row] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(tournamentSponsors)
            .where(eq(tournamentSponsors.tournamentId, tournamentId));
        return row?.count ?? 0;
    }

    async create(input: {
        tournamentId: string;
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
        createdByUserId: string;
    }): Promise<TournamentSponsor> {
        const [row] = await db
            .insert(tournamentSponsors)
            .values({
                tournamentId: input.tournamentId,
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
                createdByUserId: input.createdByUserId,
                updatedByUserId: input.createdByUserId,
            })
            .returning();

        if (!row) throw new Error('Failed to create tournament sponsor');
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
            updatedByUserId: string;
        },
    ): Promise<TournamentSponsor> {
        const [row] = await db
            .update(tournamentSponsors)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(eq(tournamentSponsors.id, id))
            .returning();

        if (!row) throw new Error('Failed to update tournament sponsor');
        return row;
    }

    async delete(id: string): Promise<void> {
        const [row] = await db
            .delete(tournamentSponsors)
            .where(eq(tournamentSponsors.id, id))
            .returning();
        if (!row) throw new Error('Failed to delete tournament sponsor');
    }
}