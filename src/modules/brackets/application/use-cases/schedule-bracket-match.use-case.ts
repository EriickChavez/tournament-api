import type { Match } from '../../../matches/domain/entities/match.entity.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import type { CreateMatchUseCase } from '../../../matches/application/use-cases/create-match.use-case.js';
import type { PhaseRepository } from '../../../phases/domain/repositories/phase.repository.js';
import { PhaseNotFoundError } from '../../../phases/domain/errors/phase.errors.js';
import type { BracketNode } from '../../domain/entities/bracket-node.entity.js';
import type { BracketRepository } from '../../domain/repositories/bracket.repository.js';
import {
    BracketNodeNotFoundError,
    BracketNodeNotReadyError,
    BracketNodeAlreadyScheduledError,
    BracketLegNotAvailableError,
    BracketFirstLegRequiredError,
    SecondLegBeforeFirstError,
} from '../../domain/errors/bracket.errors.js';

export class ScheduleBracketMatchUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly bracketRepository: BracketRepository,
        private readonly matchRepository: MatchRepository,
        private readonly createMatch: CreateMatchUseCase,
    ) { }

    async execute(input: {
        phaseId: string;
        nodeId: string;
        userId: string;
        scheduledAt: Date;
        venue?: string | undefined;
        /** 1 = partido único o ida; 2 = vuelta. */
        leg: 1 | 2;
    }): Promise<{ node: BracketNode; match: Match }> {
        const node = await this.bracketRepository.findById(input.nodeId);
        if (!node || node.phaseId !== input.phaseId) throw new BracketNodeNotFoundError();

        const phase = await this.phaseRepository.findById(node.phaseId);
        if (!phase) throw new PhaseNotFoundError();

        if (!node.homeTeamId || !node.awayTeamId) throw new BracketNodeNotReadyError();

        if (input.leg === 2) {
            if (node.legs !== 2) throw new BracketLegNotAvailableError();
            if (!node.matchId) throw new BracketFirstLegRequiredError();
            if (node.secondLegMatchId) throw new BracketNodeAlreadyScheduledError();

            // La vuelta se juega después de la ida.
            const first = await this.matchRepository.findById(node.matchId);
            if (first && input.scheduledAt.getTime() <= first.scheduledAt.getTime()) {
                throw new SecondLegBeforeFirstError();
            }
        } else if (node.matchId) {
            throw new BracketNodeAlreadyScheduledError();
        }

        // En la vuelta se invierte la localía: juega de local el equipo de abajo del cruce.
        const homeTeamId = input.leg === 1 ? node.homeTeamId : node.awayTeamId;
        const awayTeamId = input.leg === 1 ? node.awayTeamId : node.homeTeamId;

        // Se reutiliza la creación de partidos: permisos (owner/admin) y validaciones incluidas.
        const match = await this.createMatch.execute({
            tournamentId: phase.tournamentId,
            userId: input.userId,
            categoryId: phase.categoryId,
            homeTeamId,
            awayTeamId,
            scheduledAt: input.scheduledAt,
            venue: input.venue,
            phaseId: phase.id,
            phaseGroupId: null,
            // El repechaje no tiene jornada (la ronda 0 no es válida en un partido).
            round: node.stage === 'play_in' ? null : node.round,
        });

        const updated = await this.bracketRepository.attachMatch(node.id, input.leg, match.id);
        if (!updated) {
            // Otra petición programó este partido primero: se deshace el recién creado.
            await this.matchRepository.delete(match.id);
            throw new BracketNodeAlreadyScheduledError();
        }

        return { node: updated, match };
    }
}