import { env } from '../../../../config/env.js';
import type { PhaseRepository } from '../../domain/repositories/phase.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    PhaseNotFoundError,
    PhaseHasMatchesError,
} from '../../domain/errors/phase.errors.js';

export class DeletePhaseUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: { id: string; userId: string }): Promise<void> {
        const phase = await this.phaseRepository.findById(input.id);
        if (!phase) throw new PhaseNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const matchCount = await this.phaseRepository.countMatchesByPhaseId(input.id);
        if (matchCount > 0) {
            throw new PhaseHasMatchesError();
        }

        await this.phaseRepository.delete(input.id);
    }
}