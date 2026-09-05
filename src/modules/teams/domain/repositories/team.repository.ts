import type { Team } from '../entities/team.entity.js';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';

export interface TeamRepository {
    findById(id: string): Promise<Team | null>;
    findByIds(ids: string[]): Promise<Team[]>;
    findByTournamentAndName(tournamentId: string, name: string): Promise<Team | null>;
    findByTournamentId(
        tournamentId: string,
        pagination: PaginationParams,
        filters?: { categoryId?: string },
    ): Promise<Paginated<Team>>;
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