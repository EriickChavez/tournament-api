import type { Team } from '../../domain/entities/team.entity.js';

export function toPublicTeam(team: Team) {
    return {
        id: team.id,
        tournamentId: team.tournamentId,
        categoryId: team.categoryId,
        name: team.name,
        abbreviation: team.abbreviation,
        logoUrl: team.logoUrl,
    };
}