import type { TournamentSponsor } from '../../domain/entities/tournament-sponsor.entity.js';

export function toPublicTournamentSponsor(sponsor: TournamentSponsor) {
    return {
        id: sponsor.id,
        tournamentId: sponsor.tournamentId,
        name: sponsor.name,
        description: sponsor.description,
        logoUrl: sponsor.logoUrl,
        websiteUrl: sponsor.websiteUrl,
        pdfUrl: sponsor.pdfUrl,
        order: sponsor.order,
        isActive: sponsor.isActive,
        startDate: sponsor.startDate,
        endDate: sponsor.endDate,
        createdAt: sponsor.createdAt,
        updatedAt: sponsor.updatedAt,
    };
}