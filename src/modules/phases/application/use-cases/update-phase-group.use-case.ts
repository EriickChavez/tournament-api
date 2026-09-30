import { env } from '../../../../config/env.js';
import type { PhaseGroup } from '../../domain/entities/phase.entity.js';
import type {
    PhaseRepository,
    PhaseGroupRepository,
} from '../../domain/repositories/phase.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    PhaseGroupNotFoundError,
    PhaseNotFoundError,
} from '../../domain/errors/phase.errors.js';

export class UpdatePhaseGroupUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseGroupRepository: PhaseGroupRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        id: string;
        userId: string;
        name?: string | undefined;
        sortOrder?: number | undefined;
    }): Promise<PhaseGroup> {
        const group = await this.phaseGroupRepository.findById(input.id);
        if (!group) throw new PhaseGroupNotFoundError();

        const phase = await this.phaseRepository.findById(group.phaseId);
        if (!phase) throw new PhaseNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        return this.phaseGroupRepository.update(input.id, {
            name: input.name,
            sortOrder: input.sortOrder,
        });
    }
}