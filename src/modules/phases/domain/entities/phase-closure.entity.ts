export type QualifiedVia = 'group' | 'best_next';

export interface PhaseClosure {
    id: string;
    phaseId: string;
    qualifiersPerGroup: number;
    bestNextCount: number;
    closedByUserId: string | null;
    closedAt: Date;
}

export interface PhaseQualifiedTeam {
    id: string;
    phaseId: string;
    teamId: string;
    phaseGroupId: string | null;
    position: number;
    via: QualifiedVia;
    points: number;
    goalDifference: number;
    goalsFor: number;
    createdAt: Date;
}

export interface PhaseClosureDetails {
    closure: PhaseClosure;
    qualified: PhaseQualifiedTeam[];
}