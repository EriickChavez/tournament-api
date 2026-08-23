import { Tournament } from "../../domain/entities/tournaments.entity";

export function toPublicTournament(tournament: Tournament) {
    return {
        id: tournament.id,
        name: tournament.name,
        subtitle: tournament.subtitle,
        description: tournament.description,
        slug: tournament.slug,
    };
}