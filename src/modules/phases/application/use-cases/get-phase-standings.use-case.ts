import type { Match } from '../../../matches/domain/entities/match.entity.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import type { MatchEventRepository } from '../../../match-events/domain/repositories/match-event.repository.js';
import type { Phase, PhaseGroup } from '../../domain/entities/phase.entity.js';
import type { PhaseManualRank } from '../../domain/entities/phase-manual-rank.entity.js';
import type {
    PhaseRepository,
    PhaseGroupRepository,
    PhaseTeamRepository,
} from '../../domain/repositories/phase.repository.js';
import type { PhaseManualRankRepository } from '../../domain/repositories/phase-manual-rank.repository.js';
import { PhaseNotFoundError } from '../../domain/errors/phase.errors.js';
import { StandingsNotAvailableError } from '../../domain/errors/phase-standings.errors.js';
import {
    computeGroupStandings,
    type StandingMatch,
    type StandingRow,
} from '../../domain/services/group-standings.js';
import {
    computeQualification,
    type QualificationResult,
} from '../../domain/services/qualification.js';

export interface GroupStandings {
    group: PhaseGroup;
    standings: StandingRow[];
}

export interface PhaseStandings {
    phase: Phase;
    groups: GroupStandings[];
    progress: {
        expectedMatches: number;
        finishedMatches: number;
        isComplete: boolean;
    };
    qualification: QualificationResult | null;
    manualRanks: PhaseManualRank[];
}

export class GetPhaseStandingsUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseGroupRepository: PhaseGroupRepository,
        private readonly phaseTeamRepository: PhaseTeamRepository,
        private readonly matchRepository: MatchRepository,
        private readonly matchEventRepository: MatchEventRepository,
        private readonly phaseManualRankRepository: PhaseManualRankRepository,
    ) { }

    async execute(input: {
        phaseId: string;
        qualification?: { perGroup: number; bestNext: number } | undefined;
    }): Promise<PhaseStandings> {
        const phase = await this.phaseRepository.findById(input.phaseId);
        if (!phase) throw new PhaseNotFoundError();
        if (phase.type !== 'group') throw new StandingsNotAvailableError();

        const [groups, phaseTeams, matches, manualRanks] = await Promise.all([
            this.phaseGroupRepository.findByPhaseId(phase.id),
            this.phaseTeamRepository.findByPhaseId(phase.id),
            this.matchRepository.findByPhaseId(phase.id),
            this.phaseManualRankRepository.findByPhaseId(phase.id),
        ]);

        const groupRanks = new Map<string, number>();
        const bestNextRanks = new Map<string, number>();
        for (const item of manualRanks) {
            (item.scope === 'group' ? groupRanks : bestNextRanks).set(item.teamId, item.rank);
        }

        const sortedGroups = [...groups].sort(
            (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        );

        // Solo los partidos terminados cuentan para la tabla.
        const standingMatches: StandingMatch[] = [];
        for (const match of matches) {
            if (match.status !== 'finished') continue;
            standingMatches.push(await this.toStandingMatch(match));
        }

        const result: GroupStandings[] = [];
        let expectedMatches = 0;
        let finishedMatches = 0;

        for (const group of sortedGroups) {
            const teamIds = phaseTeams
                .filter((pt) => pt.phaseGroupId === group.id)
                .map((pt) => pt.teamId);
            const inGroup = new Set(teamIds);

            result.push({
                group,
                standings: computeGroupStandings(teamIds, standingMatches, groupRanks),
            });

            // Todos contra todos: n equipos juegan n*(n-1)/2 partidos.
            expectedMatches += (teamIds.length * (teamIds.length - 1)) / 2;
            finishedMatches += standingMatches.filter(
                (m) => inGroup.has(m.homeTeamId) && inGroup.has(m.awayTeamId),
            ).length;
        }

        const qualification = input.qualification
            ? computeQualification(
                result.map((r) => ({
                    groupId: r.group.id,
                    groupName: r.group.name,
                    standings: r.standings,
                })),
                input.qualification.perGroup,
                input.qualification.bestNext,
                bestNextRanks,
            )
            : null;

        return {
            phase,
            groups: result,
            progress: {
                expectedMatches,
                finishedMatches,
                // La fase se cierra siempre a mano; esto solo permite sugerirlo.
                isComplete: expectedMatches > 0 && finishedMatches >= expectedMatches,
            },
            qualification,
            manualRanks,
        };
    }

    /** Misma regla que las posiciones por categoría: el marcador manda; si no hay, eventos de gol. */
    private async toStandingMatch(match: Match): Promise<StandingMatch> {
        if (match.homeScore !== null && match.awayScore !== null) {
            return {
                homeTeamId: match.homeTeamId,
                awayTeamId: match.awayTeamId,
                homeGoals: match.homeScore,
                awayGoals: match.awayScore,
            };
        }

        const events = await this.matchEventRepository.findByMatchId(match.id);
        const goals = events.filter((e) => e.eventType === 'gol');
        return {
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            homeGoals: goals.filter((e) => e.teamId === match.homeTeamId).length,
            awayGoals: goals.filter((e) => e.teamId === match.awayTeamId).length,
        };
    }
}