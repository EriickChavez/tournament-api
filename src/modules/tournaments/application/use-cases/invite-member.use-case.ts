import { env } from '../../../../config/env.js';
import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { UserRepository } from '../../../auth/domain/repositories/user.repository.js';
import type { TournamentMember } from '../../domain/entities/tournaments-member.entity.js';
import {
    TournamentNotFoundError,
    NotTournamentOwnerOrAdminError,
    AlreadyTournamentMemberError,
    TargetUserNotFoundError,
} from '../../domain/errors/tournaments.errors.js';

export class InviteMemberUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly userRepository: UserRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        requesterId: string;
        targetUserId: string;
    }): Promise<TournamentMember> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const requester = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.requesterId,
        );
        if (!requester || (requester.roleId !== env.OWNER_ROLE_ID && requester.roleId !== env.ADMIN_ROLE_ID)) {
            throw new NotTournamentOwnerOrAdminError();
        }

        const targetUser = await this.userRepository.findById(input.targetUserId);
        if (!targetUser) throw new TargetUserNotFoundError();

        const existing = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.targetUserId,
        );
        if (existing) throw new AlreadyTournamentMemberError();

        return this.tournamentMemberRepository.create({
            tournamentId: input.tournamentId,
            userId: input.targetUserId,
            roleId: env.ADMIN_ROLE_ID,
        });
    }
}