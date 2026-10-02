import type { PhaseRepository } from '../../../phases/domain/repositories/phase.repository.js';
import { PhaseNotFoundError } from '../../../phases/domain/errors/phase.errors.js';
import type { BracketNode } from '../../domain/entities/bracket-node.entity.js';
import type { BracketRepository } from '../../domain/repositories/bracket.repository.js';

export class GetBracketUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly bracketRepository: BracketRepository,
    ) { }

    async execute(phaseId: string): Promise<BracketNode[]> {
        const phase = await this.phaseRepository.findById(phaseId);
        if (!phase) throw new PhaseNotFoundError();
        return this.bracketRepository.findByPhaseId(phase.id);
    }
}