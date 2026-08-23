import { Tournament } from "../entities/tournaments.entity";

export interface TournamentRepository {
    findBySlug(slug: string): Promise<Tournament | null>;
    create(input: {
        name: string;
        subtitle: string | null;
        description: string | null;
        slug: string;
        createdByUserId: string;
    }): Promise<Tournament>;
}
