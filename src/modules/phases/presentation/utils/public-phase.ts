import type { Phase, PhaseGroup, PhaseTeam } from '../../domain/entities/phase.entity.js';

export function toPublicPhase(phase: Phase) {
    return {
        id: phase.id,
        tournamentId: phase.tournamentId,
        categoryId: phase.categoryId,
        name: phase.name,
        type: phase.type,
        status: phase.status,
        sortOrder: phase.sortOrder,
        startDate: phase.startDate,
        endDate: phase.endDate,
        createdAt: phase.createdAt,
        updatedAt: phase.updatedAt,
    };
}

export function toPublicPhaseGroup(group: PhaseGroup) {
    return {
        id: group.id,
        phaseId: group.phaseId,
        name: group.name,
        sortOrder: group.sortOrder,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
    };
}

export function toPublicPhaseTeam(pt: PhaseTeam) {
    return {
        id: pt.id,
        phaseId: pt.phaseId,
        teamId: pt.teamId,
        phaseGroupId: pt.phaseGroupId,
        seed: pt.seed,
        createdAt: pt.createdAt,
        updatedAt: pt.updatedAt,
    };
}