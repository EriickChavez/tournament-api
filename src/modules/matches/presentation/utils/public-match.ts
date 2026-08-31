import type { Match } from '../../domain/entities/match.entity.js';
import type { Team } from '../../../teams/domain/entities/team.entity.js';
import type { Category } from '../../../categories/domain/entities/category.entity.js';
import type { MatchWithDetails } from '../../application/use-cases/match-with-details.js';

export function toPublicTeamSummary(team: Team) {
    return {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        logoUrl: team.logoUrl,
    };
}

export function toPublicCategorySummary(category: Category) {
    return {
        id: category.id,
        title: category.title,
    };
}

/** Shape plano (create/update). */
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

/** Shape enriquecido (list / get / public calendar). */
export function toPublicMatchDetails(details: MatchWithDetails) {
    return {
        ...toPublicMatch(details),
        homeTeam: toPublicTeamSummary(details.homeTeam),
        awayTeam: toPublicTeamSummary(details.awayTeam),
        category: toPublicCategorySummary(details.category),
    };
}