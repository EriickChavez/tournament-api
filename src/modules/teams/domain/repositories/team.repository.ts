import type { Team } from '../entities/team.entity.js';

export interface TeamRepository {
    findById(id: string): Promise<Team | null>;
    findByTournamentAndName(tournamentId: string, name: string): Promise<Team | null>;
    findByTournamentId(tournamentId: string): Promise<Team[]>;
    create(input: {
        tournamentId: string;
        categoryId: string;
        name: string;
        abbreviation?: string | null | undefined;
        logoUrl?: string | null | undefined;
    }): Promise<Team>;
    update(
        id: string,
        input: {
            categoryId?: string | undefined;
            name?: string | undefined;
            abbreviation?: string | null | undefined;
            logoUrl?: string | null | undefined;
        },
    ): Promise<Team>;
    delete(id: string): Promise<void>;
}