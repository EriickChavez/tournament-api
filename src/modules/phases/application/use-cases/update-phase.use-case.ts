import { env } from '../../../../config/env.js';
import type { Phase, PhaseType, PhaseStatus } from '../../domain/entities/phase.entity.js';
import type { PhaseRepository } from '../../domain/repositories/phase.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    PhaseNotFoundError,
    InvalidPhaseDateRangeError,
} from '../../domain/errors/phase.errors.js';

export class UpdatePhaseUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        id: string;
        userId: string;
        name?: string | undefined;
        type?: PhaseType | undefined;
        status?: PhaseStatus | undefined;
        sortOrder?: number | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
    }): Promise<Phase> {
        const phase = await this.phaseRepository.findById(input.id);
        if (!phase) throw new PhaseNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const startDate = input.startDate !== undefined ? input.startDate : phase.startDate;
        const endDate = input.endDate !== undefined ? input.endDate : phase.endDate;

        if (startDate && endDate && endDate < startDate) {
            throw new InvalidPhaseDateRangeError();
        }

        return this.phaseRepository.update(input.id, {
            name: input.name,
            type: input.type,
            status: input.status,
            sortOrder: input.sortOrder,
            startDate: input.startDate,
            endDate: input.endDate,
            updatedByUserId: input.userId,
        });
    }
}