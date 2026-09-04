import type { TournamentMember, TournamentMemberWithUser } from '../entities/tournaments-member.entity.js';
import type { Paginated, PaginationParams } from '../../../../shared/utils/pagination.js';

export interface TournamentMemberRepository {
    create(input: { tournamentId: string; userId: string; roleId: string }): Promise<TournamentMember>;
    findByTournamentAndUser(tournamentId: string, userId: string): Promise<TournamentMember | null>;
    findById(id: string): Promise<TournamentMember | null>;
    listByTournament(
        tournamentId: string,
        pagination: PaginationParams,
    ): Promise<Paginated<TournamentMemberWithUser>>;
    updateRole(id: string, roleId: string): Promise<TournamentMember>;
    delete(id: string): Promise<void>;
}