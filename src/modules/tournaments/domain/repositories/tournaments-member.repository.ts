import type { TournamentMember, TournamentMemberWithUser } from '../entities/tournaments-member.entity.js';

export interface TournamentMemberRepository {
    create(input: { tournamentId: string; userId: string; roleId: string }): Promise<TournamentMember>;
    findByTournamentAndUser(tournamentId: string, userId: string): Promise<TournamentMember | null>;
    findById(id: string): Promise<TournamentMember | null>;
    listByTournament(tournamentId: string): Promise<TournamentMemberWithUser[]>;
    updateRole(id: string, roleId: string): Promise<TournamentMember>;
    delete(id: string): Promise<void>;
}