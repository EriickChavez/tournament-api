import type { Phase, PhaseGroup, PhaseTeam, PhaseType, PhaseStatus } from '../entities/phase.entity.js';

export interface PhaseRepository {
    findById(id: string): Promise<Phase | null>;
    findByCategoryId(categoryId: string): Promise<Phase[]>;
    findByTournamentId(tournamentId: string): Promise<Phase[]>;
    create(input: {
        tournamentId: string;
        categoryId: string;
        name: string;
        type: PhaseType;
        status?: PhaseStatus | undefined;
        sortOrder?: number | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
        createdByUserId: string;
    }): Promise<Phase>;
    update(
        id: string,
        input: {
            name?: string | undefined;
            type?: PhaseType | undefined;
            status?: PhaseStatus | undefined;
            sortOrder?: number | undefined;
            startDate?: string | null | undefined;
            endDate?: string | null | undefined;
            updatedByUserId: string;
        },
    ): Promise<Phase>;
    delete(id: string): Promise<void>;
    countMatchesByPhaseId(phaseId: string): Promise<number>;
}

export interface PhaseGroupRepository {
    findById(id: string): Promise<PhaseGroup | null>;
    findByPhaseId(phaseId: string): Promise<PhaseGroup[]>;
    create(input: {
        phaseId: string;
        name: string;
        sortOrder?: number | undefined;
    }): Promise<PhaseGroup>;
    update(
        id: string,
        input: {
            name?: string | undefined;
            sortOrder?: number | undefined;
        },
    ): Promise<PhaseGroup>;
    delete(id: string): Promise<void>;
}

export interface PhaseTeamRepository {
    findByPhaseId(phaseId: string): Promise<PhaseTeam[]>;
    findByPhaseAndTeam(phaseId: string, teamId: string): Promise<PhaseTeam | null>;
    /** Replaces all teams for a phase (atomic sync). */
    sync(
        phaseId: string,
        teams: Array<{
            teamId: string;
            phaseGroupId?: string | null | undefined;
            seed?: number | null | undefined;
        }>,
    ): Promise<PhaseTeam[]>;
    deleteByPhaseId(phaseId: string): Promise<void>;
}