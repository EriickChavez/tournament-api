import { Paginated, PaginationParams } from '../../../../shared/utils/pagination.js';
import type { Match, MatchStatus } from '../entities/match.entity.js';

export interface MatchRepository {
    findFinishedByTournamentCategoryAndTeam(
        tournamentId: string,
        categoryId: string,
        teamId: string,
    ): Promise<Match[]>;
    findFinishedByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<Match[]>;
    findById(id: string): Promise<Match | null>;
    findByTournamentId(
        tournamentId: string,
        pagination: PaginationParams,
        filters?: {
            categoryId?: string | undefined;
            status?: MatchStatus | undefined;
        },
    ): Promise<Paginated<Match>>;
    create(input: {
        tournamentId: string;
        categoryId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledAt: Date;
        venue?: string | null | undefined;
        status?: MatchStatus | undefined;
        createdByUserId: string;
    }): Promise<Match>;
    update(
        id: string,
        input: {
            categoryId?: string | undefined;
            homeTeamId?: string | undefined;
            awayTeamId?: string | undefined;
            scheduledAt?: Date | undefined;
            venue?: string | null | undefined;
            status?: MatchStatus | undefined;
            updatedByUserId: string;
        },
    ): Promise<Match>;
    delete(id: string): Promise<void>;
}