import { env } from '../../../../config/env.js';
import type { Phase } from '../../domain/entities/phase.entity.js';
import type { PhaseClosureDetails } from '../../domain/entities/phase-closure.entity.js';
import type { PhaseRepository } from '../../domain/repositories/phase.repository.js';
import type { PhaseClosureRepository } from '../../domain/repositories/phase-closure.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { PhaseNotFoundError } from '../../domain/errors/phase.errors.js';
import {
    StandingsNotAvailableError,
    PhaseAlreadyClosedError,
    PhaseNotCompleteError,
    PhaseHasPendingTiesError,
    InvalidQualificationConfigError,
} from '../../domain/errors/phase-standings.errors.js';
import type { StandingRow } from '../../domain/services/group-standings.js';
import type { GetPhaseStandingsUseCase } from './get-phase-standings.use-case.js';

export class ClosePhaseUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly getPhaseStandings: GetPhaseStandingsUseCase,
        private readonly phaseClosureRepository: PhaseClosureRepository,
    ) { }

    async execute(input: {
        phaseId: string;
        userId: string;
        perGroup: number;
        bestNext: number;
    }): Promise<{ phase: Phase; closure: PhaseClosureDetails }> {
        const phase = await this.phaseRepository.findById(input.phaseId);
        if (!phase) throw new PhaseNotFoundError();
        if (phase.type !== 'group') throw new StandingsNotAvailableError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        if (phase.status === 'finished') throw new PhaseAlreadyClosedError();

        // Se reutiliza el mismo cálculo que ve el admin en pantalla, con la configuración elegida.
        const standings = await this.getPhaseStandings.execute({
            phaseId: phase.id,
            qualification: { perGroup: input.perGroup, bestNext: input.bestNext },
        });

        if (!standings.progress.isComplete) {
            throw new PhaseNotCompleteError(
                standings.progress.finishedMatches,
                standings.progress.expectedMatches,
            );
        }

        const qualification = standings.qualification;
        if (!qualification) {
            throw new InvalidQualificationConfigError('Qualification could not be computed.');
        }

        if (qualification.pendingTies.length > 0) throw new PhaseHasPendingTiesError();

        if (input.bestNext > qualification.bestNextRanking.length) {
            throw new InvalidQualificationConfigError(
                `bestNext (${input.bestNext}) is greater than the number of candidates (${qualification.bestNextRanking.length}).`,
            );
        }

        const rowByTeam = new Map<string, StandingRow>();
        for (const group of standings.groups) {
            for (const row of group.standings) rowByTeam.set(row.teamId, row);
        }

        const qualified = [];
        for (const item of qualification.qualified) {
            const row = rowByTeam.get(item.teamId);
            if (!row) continue;
            qualified.push({
                teamId: item.teamId,
                phaseGroupId: item.groupId,
                position: item.position,
                via: item.via,
                points: row.points,
                goalDifference: row.goalDifference,
                goalsFor: row.goalsFor,
            });
        }

        if (qualified.length === 0) {
            throw new InvalidQualificationConfigError('No teams qualify with this configuration.');
        }

        const closure = await this.phaseClosureRepository.close({
            phaseId: phase.id,
            userId: input.userId,
            qualifiersPerGroup: input.perGroup,
            bestNextCount: input.bestNext,
            qualified,
        });

        const closedPhase = await this.phaseRepository.findById(phase.id);
        if (!closedPhase) throw new PhaseNotFoundError();

        return { phase: closedPhase, closure };
    }
}