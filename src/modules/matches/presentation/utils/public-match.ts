import type { Match } from '../../domain/entities/match.entity.js';

export function toPublicMatch(match: Match) {
    return {
        id: match.id,
        tournamentId: match.tournamentId,
        categoryId: match.categoryId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        scheduledAt: match.scheduledAt.toISOString(),
        venue: match.venue,
        status: match.status,
    };
}