import { env } from '../../../../config/env.js';
import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import type { TournamentMember } from '../../domain/entities/tournaments-member.entity.js';
import {
    NotTournamentOwnerError,
    MemberNotFoundError,
    CannotModifyOwnerError,
} from '../../domain/errors/tournaments.errors.js';

export class UpdateMemberRoleUseCase {
    constructor(private readonly tournamentMemberRepository: TournamentMemberRepository) { }

    async execute(input: {
        tournamentId: string;
        requesterId: string;
        memberId: string;
    }): Promise<TournamentMember> {
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

        // Hoy solo existe el rol ADMIN como asignable; si en el futuro hay más
        // roles no-owner, aquí es donde se recibiría el roleId destino.
        return this.tournamentMemberRepository.updateRole(member.id, env.ADMIN_ROLE_ID);
    }
}