import type { PhaseClosureDetails, QualifiedVia } from '../entities/phase-closure.entity.js';

export interface ClosePhaseInput {
    phaseId: string;
    userId: string;
    qualifiersPerGroup: number;
    bestNextCount: number;
    qualified: Array<{
        teamId: string;
        phaseGroupId: string | null;
        position: number;
        via: QualifiedVia;
        points: number;
        goalDifference: number;
        goalsFor: number;
    }>;
}

export interface PhaseClosureRepository {
    findByPhaseId(phaseId: string): Promise<PhaseClosureDetails | null>;
    /** Cierra la fase: guarda cierre + clasificados y marca la fase como finished, todo en una transacción. */
    close(input: ClosePhaseInput): Promise<PhaseClosureDetails>;
    /** Reabre la fase: borra cierre + clasificados y la vuelve a active, todo en una transacción. */
    reopen(phaseId: string, userId: string): Promise<void>;
}