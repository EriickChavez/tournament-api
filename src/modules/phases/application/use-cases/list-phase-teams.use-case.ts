import type { PhaseTeam } from '../../domain/entities/phase.entity.js';
import type {
    PhaseRepository,
    PhaseTeamRepository,
} from '../../domain/repositories/phase.repository.js';
import { PhaseNotFoundError } from '../../domain/errors/phase.errors.js';

export class ListPhaseTeamsUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseTeamRepository: PhaseTeamRepository,
    ) { }

    async execute(phaseId: string): Promise<PhaseTeam[]> {
        const phase = await this.phaseRepository.findById(phaseId);
        if (!phase) throw new PhaseNotFoundError();
        return this.phaseTeamRepository.findByPhaseId(phaseId);
    }
}