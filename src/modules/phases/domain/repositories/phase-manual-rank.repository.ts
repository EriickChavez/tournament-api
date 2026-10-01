import type { ManualRankScope, PhaseManualRank } from '../entities/phase-manual-rank.entity.js';

export interface PhaseManualRankRepository {
    findByPhaseId(phaseId: string): Promise<PhaseManualRank[]>;
    /**
     * Reemplaza todas las decisiones de un tipo (group o best_next) de la fase, de forma
     * atómica. Una lista vacía las borra. Devuelve todas las decisiones de la fase.
     */
    replaceScope(
        phaseId: string,
        scope: ManualRankScope,
        ranks: Array<{ teamId: string; rank: number }>,
    ): Promise<PhaseManualRank[]>;
}