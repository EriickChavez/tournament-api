import { env } from '../../../../config/env.js';
import { logger } from '../../../../shared/logging/logger.js';
import type { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';
import type { PhaseRepository } from '../../domain/repositories/phase.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    PhaseNotFoundError,
    PhaseHasMatchesError,
} from '../../domain/errors/phase.errors.js';

/** Puerto mínimo para recalcular posiciones, goleadores y tarjetas de una categoría. */
export interface PhaseStatsRecalculator {
    recalculateForTeams(tournamentId: string, categoryId: string, teamIds: string[]): Promise<void>;
}

export class DeletePhaseUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly competitionGuard: CompetitionGuard,
        private readonly statsRecalculator: PhaseStatsRecalculator,
    ) { }

    async execute(input: {
        id: string;
        userId: string;
        /** true = borra también los partidos de la fase (solo owner, campeonato abierto). */
        force?: boolean;
    }): Promise<{ deletedMatches: number }> {
        const phase = await this.phaseRepository.findById(input.id);
        if (!phase) throw new PhaseNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        if (!input.force) {
            const matchCount = await this.phaseRepository.countMatchesByPhaseId(input.id);
            if (matchCount > 0) throw new PhaseHasMatchesError();

            await this.phaseRepository.delete(input.id);
            return { deletedMatches: 0 };
        }

        // Con el campeonato cerrado nada se toca: hay que reabrirlo primero.
        await this.competitionGuard.assertNotFinished(phase.categoryId);

        const { deletedMatches, finishedTeamIds } =
            await this.phaseRepository.deleteWithMatches(input.id);

        // Las posiciones, goleadores y tarjetas son tablas materializadas: sin recalcular,
        // los puntos de los partidos borrados se quedarían. La fase ya se borró, así que un
        // fallo aquí se registra pero no se le devuelve al cliente como error.
        if (finishedTeamIds.length > 0) {
            try {
                await this.statsRecalculator.recalculateForTeams(
                    phase.tournamentId,
                    phase.categoryId,
                    finishedTeamIds,
                );
            } catch (err) {
                logger.error(
                    { err, phaseId: phase.id, categoryId: phase.categoryId },
                    'Phase deleted but stats recalculation failed',
                );
            }
        }

        return { deletedMatches };
    }
}