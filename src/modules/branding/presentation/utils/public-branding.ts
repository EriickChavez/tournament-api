import type { TournamentBranding } from '../../domain/entities/branding.entity.js';

export function toPublicBranding(branding: TournamentBranding) {
    return {
        tournamentId: branding.tournamentId,
        logoUrl: branding.logoUrl,
        bannerUrl: branding.bannerUrl,
        updatedAt: branding.updatedAt,
    };
}