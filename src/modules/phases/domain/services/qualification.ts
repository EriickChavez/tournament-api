import type { StandingRow } from './group-standings.js';

export interface GroupStandingsInput {
    groupId: string;
    groupName: string;
    standings: StandingRow[];
}

export interface QualifiedTeam {
    teamId: string;
    groupId: string;
    position: number;
    via: 'group' | 'best_next';
}

export interface BestNextEntry {
    teamId: string;
    groupId: string;
    points: number;
    goalDifference: number;
    goalsFor: number;
    qualified: boolean;
}

export interface PendingTie {
    scope: 'group' | 'best_next';
    groupId: string | null;
    teamIds: string[];
}

export interface QualificationResult {
    perGroup: number;
    bestNext: number;
    qualified: QualifiedTeam[];
    bestNextRanking: BestNextEntry[];
    pendingTies: PendingTie[];
}

/**
 * Clasificados de una fase de grupos: los primeros `perGroup` de cada grupo más los
 * `bestNext` mejores equipos entre los que quedaron justo después (p. ej. mejores terceros).
 * Los empates que afectan quién clasifica se devuelven en `pendingTies` para decisión manual.
 */
export function computeQualification(
    groups: GroupStandingsInput[],
    perGroup: number,
    bestNext: number,
): QualificationResult {
    const qualified: QualifiedTeam[] = [];
    const pendingTies: PendingTie[] = [];
    const candidates: Omit<BestNextEntry, 'qualified'>[] = [];

    for (const group of groups) {
        for (const row of group.standings) {
            if (row.position <= perGroup) {
                qualified.push({
                    teamId: row.teamId,
                    groupId: group.groupId,
                    position: row.position,
                    via: 'group',
                });
            }
        }

        // Empate dentro del grupo que cruza la línea de clasificación.
        const last = group.standings[perGroup - 1];
        const next = group.standings[perGroup];
        if (last && next && last.tieGroup !== null && last.tieGroup === next.tieGroup) {
            pendingTies.push({
                scope: 'group',
                groupId: group.groupId,
                teamIds: group.standings
                    .filter((row) => row.tieGroup === last.tieGroup)
                    .map((row) => row.teamId),
            });
        }

        if (next) {
            candidates.push({
                teamId: next.teamId,
                groupId: group.groupId,
                points: next.points,
                goalDifference: next.goalDifference,
                goalsFor: next.goalsFor,
            });
        }
    }

    // Entre grupos no hay head-to-head: solo puntos, diferencia y goles a favor.
    candidates.sort(
        (a, b) =>
            b.points - a.points ||
            b.goalDifference - a.goalDifference ||
            b.goalsFor - a.goalsFor ||
            a.groupId.localeCompare(b.groupId),
    );

    const bestNextRanking: BestNextEntry[] = candidates.map((c, index) => ({
        ...c,
        qualified: index < bestNext,
    }));

    for (const entry of bestNextRanking) {
        if (!entry.qualified) continue;
        qualified.push({
            teamId: entry.teamId,
            groupId: entry.groupId,
            position: perGroup + 1,
            via: 'best_next',
        });
    }

    // Empate en la línea de corte de los mejores (el último que entra vs. el primero que queda fuera).
    const lastIn = bestNextRanking[bestNext - 1];
    const firstOut = bestNextRanking[bestNext];
    if (bestNext > 0 && lastIn && firstOut) {
        const tiedAtCut = (e: BestNextEntry) =>
            e.points === lastIn.points &&
            e.goalDifference === lastIn.goalDifference &&
            e.goalsFor === lastIn.goalsFor;
        if (tiedAtCut(firstOut)) {
            pendingTies.push({
                scope: 'best_next',
                groupId: null,
                teamIds: bestNextRanking.filter(tiedAtCut).map((e) => e.teamId),
            });
        }
    }

    return { perGroup, bestNext, qualified, bestNextRanking, pendingTies };
}