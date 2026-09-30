import type { Phase } from '../../domain/entities/phase.entity.js';
import type { PhaseRepository } from '../../domain/repositories/phase.repository.js';
import { PhaseNotFoundError } from '../../domain/errors/phase.errors.js';

export class GetPhaseUseCase {
    constructor(private readonly phaseRepository: PhaseRepository) { }

    async execute(id: string): Promise<Phase> {
        const phase = await this.phaseRepository.findById(id);
        if (!phase) throw new PhaseNotFoundError();
        return phase;
    }
}