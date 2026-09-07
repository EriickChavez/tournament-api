import type { TournamentBranding } from '../entities/branding.entity.js';

export interface BrandingRepository {
    findByTournamentId(tournamentId: string): Promise<TournamentBranding | null>;
    upsert(input: {
        tournamentId: string;
        logoUrl?: string | null | undefined;
        bannerUrl?: string | null | undefined;
        updatedByUserId: string;
    }): Promise<TournamentBranding>;
}