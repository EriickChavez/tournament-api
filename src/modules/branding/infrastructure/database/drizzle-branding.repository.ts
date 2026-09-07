import { eq, inArray } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { tournamentBranding } from './schema.js';
import type { BrandingRepository } from '../../domain/repositories/branding.repository.js';
import type { TournamentBranding } from '../../domain/entities/branding.entity.js';

export class DrizzleBrandingRepository implements BrandingRepository {
    async findByTournamentId(tournamentId: string): Promise<TournamentBranding | null> {
        const [row] = await db
            .select()
            .from(tournamentBranding)
            .where(eq(tournamentBranding.tournamentId, tournamentId))
            .limit(1);
        return row ?? null;
    }

    async findByTournamentIds(tournamentIds: string[]): Promise<TournamentBranding[]> {
        if (tournamentIds.length === 0) return [];
        return db
            .select()
            .from(tournamentBranding)
            .where(inArray(tournamentBranding.tournamentId, tournamentIds));
    }

    async upsert(input: {
        tournamentId: string;
        logoUrl?: string | null | undefined;
        bannerUrl?: string | null | undefined;
        updatedByUserId: string;
    }): Promise<TournamentBranding> {
        const existing = await this.findByTournamentId(input.tournamentId);

        const logoUrl = input.logoUrl !== undefined ? input.logoUrl : (existing?.logoUrl ?? null);
        const bannerUrl =
            input.bannerUrl !== undefined ? input.bannerUrl : (existing?.bannerUrl ?? null);

        const [row] = await db
            .insert(tournamentBranding)
            .values({
                tournamentId: input.tournamentId,
                logoUrl,
                bannerUrl,
                createdByUserId: input.updatedByUserId,
                updatedByUserId: input.updatedByUserId,
            })
            .onConflictDoUpdate({
                target: tournamentBranding.tournamentId,
                set: {
                    logoUrl,
                    bannerUrl,
                    updatedByUserId: input.updatedByUserId,
                    updatedAt: new Date(),
                },
            })
            .returning();

        if (!row) throw new Error('Failed to upsert tournament branding');
        return row;
    }
}