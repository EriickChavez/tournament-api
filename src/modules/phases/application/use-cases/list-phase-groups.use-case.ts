import type { PhaseGroup } from '../../domain/entities/phase.entity.js';
import type {
    PhaseRepository,
    PhaseGroupRepository,
} from '../../domain/repositories/phase.repository.js';
import { PhaseNotFoundError } from '../../domain/errors/phase.errors.js';

export class ListPhaseGroupsUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseGroupRepository: PhaseGroupRepository,
    ) { }

    async execute(phaseId: string): Promise<PhaseGroup[]> {
        const phase = await this.phaseRepository.findById(phaseId);
        if (!phase) throw new PhaseNotFoundError();
        return this.phaseGroupRepository.findByPhaseId(phaseId);
    }
}