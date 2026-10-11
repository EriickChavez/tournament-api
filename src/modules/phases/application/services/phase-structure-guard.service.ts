import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import { PhaseStructureLockedError } from '../../domain/errors/phase-structure.errors.js';

export class PhaseStructureGuardService {
    constructor(private readonly matchRepository: MatchRepository) { }

    /** La estructura (grupos y equipos asignados) se congela en cuanto la fase tiene partidos. */
    async assertNoMatches(phaseId: string): Promise<void> {
        const matches = await this.matchRepository.findByPhaseId(phaseId);
        if (matches.length > 0) throw new PhaseStructureLockedError();
    }
}