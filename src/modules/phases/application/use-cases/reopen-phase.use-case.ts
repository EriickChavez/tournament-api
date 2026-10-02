import { env } from '../../../../config/env.js';
import type { Phase } from '../../domain/entities/phase.entity.js';
import type { PhaseRepository } from '../../domain/repositories/phase.repository.js';
import type { PhaseClosureRepository } from '../../domain/repositories/phase-closure.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { PhaseNotFoundError } from '../../domain/errors/phase.errors.js';
import { PhaseNotClosedError } from '../../domain/errors/phase-standings.errors.js';

export class ReopenPhaseUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly phaseClosureRepository: PhaseClosureRepository,
    ) { }

    async execute(input: { phaseId: string; userId: string }): Promise<Phase> {
        const phase = await this.phaseRepository.findById(input.phaseId);
        if (!phase) throw new PhaseNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const closure = await this.phaseClosureRepository.findByPhaseId(phase.id);
        if (!closure) throw new PhaseNotClosedError();

        // Cuando exista la llave, aquí se bloqueará la reapertura si ya hay partidos de la siguiente fase.
        await this.phaseClosureRepository.reopen(phase.id, input.userId);

        const reopened = await this.phaseRepository.findById(phase.id);
        if (!reopened) throw new PhaseNotFoundError();
        return reopened;
    }
}