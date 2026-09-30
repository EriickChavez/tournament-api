import { env } from '../../../../config/env.js';
import type { PhaseGroup } from '../../domain/entities/phase.entity.js';
import type {
    PhaseRepository,
    PhaseGroupRepository,
} from '../../domain/repositories/phase.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    PhaseNotFoundError,
    PhaseGroupNotAllowedError,
} from '../../domain/errors/phase.errors.js';

export class CreatePhaseGroupUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseGroupRepository: PhaseGroupRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        phaseId: string;
        userId: string;
        name: string;
        sortOrder?: number | undefined;
    }): Promise<PhaseGroup> {
        const phase = await this.phaseRepository.findById(input.phaseId);
        if (!phase) throw new PhaseNotFoundError();

        if (phase.type !== 'group') {
            throw new PhaseGroupNotAllowedError();
        }

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        return this.phaseGroupRepository.create({
            phaseId: input.phaseId,
            name: input.name,
            sortOrder: input.sortOrder,
        });
    }
}