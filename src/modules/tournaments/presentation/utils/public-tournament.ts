import { Tournament } from "../../domain/entities/tournaments.entity";

export function toPublicTournament(tournament: Tournament) {
    return {
        id: tournament.id,
        name: tournament.name,
        subtitle: tournament.subtitle,
        description: tournament.description,
        slug: tournament.slug,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        timezone: tournament.timezone,
    };
}

export function toPublicTournamentWithRole(tournament: Tournament & { roleId: string }) {
    return {
        ...toPublicTournament(tournament),
        roleId: tournament.roleId,
    };
}