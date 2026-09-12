import { env } from '../../../../config/env.js';
import type { TournamentSponsor } from '../../domain/entities/tournament-sponsor.entity.js';
import type { TournamentSponsorRepository } from '../../domain/repositories/tournament-sponsor.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';

export class ListAdminTournamentSponsorsUseCase {
    constructor(
        private readonly sponsorRepository: TournamentSponsorRepository,
        private readonly memberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
    }): Promise<TournamentSponsor[]> {
        const member = await this.memberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        return this.sponsorRepository.listByTournament(input.tournamentId);
    }
}