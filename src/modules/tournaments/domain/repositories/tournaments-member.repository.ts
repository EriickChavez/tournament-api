import type { TournamentMember } from '../entities/tournaments-member.entity';

export interface TournamentMemberRepository {
    create(input: { tournamentId: string; userId: string; roleId: string }): Promise<TournamentMember>;
}