import type { Paginated, PaginationParams } from '../../../../shared/utils/pagination.js';
import type { Match, MatchStatus } from '../entities/match.entity.js';

export interface MyMatchesFilters {
    tournamentId?: string | undefined;
    status?: MatchStatus | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}

export interface MatchRefereeRepository {
    findUserIdsByMatchId(matchId: string): Promise<string[]>;
    /** Reemplaza el conjunto completo de árbitros del partido (vacío = sin asignar). */
    replaceForMatch(matchId: string, userIds: string[], assignedByUserId: string): Promise<void>;
    /** Partidos asignados al usuario, ordenados por fecha. */
    findMatchesByUserId(
        userId: string,
        pagination: PaginationParams,
        filters?: MyMatchesFilters,
    ): Promise<Paginated<Match>>;
}