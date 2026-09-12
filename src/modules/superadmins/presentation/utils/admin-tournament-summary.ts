import type { Tournament } from '../../../tournaments/domain/entities/tournaments.entity.js';

export function toAdminTournamentSummary(tournament: Tournament) {
    return {
        id: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        maxSponsors: tournament.maxSponsors,
        createdAt: tournament.createdAt,
    };
}