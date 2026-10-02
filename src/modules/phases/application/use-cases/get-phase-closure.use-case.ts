import type { PhaseClosureDetails } from '../../domain/entities/phase-closure.entity.js';
import type { PhaseClosureRepository } from '../../domain/repositories/phase-closure.repository.js';

export class GetPhaseClosureUseCase {
    constructor(private readonly phaseClosureRepository: PhaseClosureRepository) { }

    async execute(phaseId: string): Promise<PhaseClosureDetails | null> {
        return this.phaseClosureRepository.findByPhaseId(phaseId);
    }
}