export type PhaseType = 'group' | 'knockout' | 'league';

export type PhaseStatus = 'upcoming' | 'active' | 'finished';

export interface Phase {
    id: string;
    tournamentId: string;
    categoryId: string;
    name: string;
    type: PhaseType;
    status: PhaseStatus;
    sortOrder: number;
    startDate: string | null;
    endDate: string | null;
    createdByUserId: string | null;
    updatedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface PhaseGroup {
    id: string;
    phaseId: string;
    name: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PhaseTeam {
    id: string;
    phaseId: string;
    teamId: string;
    phaseGroupId: string | null;
    seed: number | null;
    createdAt: Date;
    updatedAt: Date;
}