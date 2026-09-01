import { env } from '../../../../config/env.js';
import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError, MemberNotFoundError, CannotModifyOwnerError } from '../../domain/errors/tournaments.errors.js';

export class RemoveMemberUseCase {
    constructor(private readonly tournamentMemberRepository: TournamentMemberRepository) { }

    async execute(input: { tournamentId: string; requesterId: string; memberId: string }): Promise<void> {
        const requester = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.requesterId,
        );
        if (!requester || requester.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const member = await this.tournamentMemberRepository.findById(input.memberId);
        if (!member || member.tournamentId !== input.tournamentId) throw new MemberNotFoundError();
        if (member.roleId === env.OWNER_ROLE_ID) throw new CannotModifyOwnerError();

        await this.tournamentMemberRepository.delete(member.id);
    }
}