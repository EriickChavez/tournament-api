export type ManualRankScope = 'group' | 'best_next';

export interface PhaseManualRank {
    id: string;
    phaseId: string;
    teamId: string;
    scope: ManualRankScope;
    /** Menor número = mejor posición. */
    rank: number;
    createdAt: Date;
    updatedAt: Date;
}