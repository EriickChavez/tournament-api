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
    }): Promise<{ node: BracketNode; match: Match }> {
        const node = await this.bracketRepository.findById(input.nodeId);
        if (!node || node.phaseId !== input.phaseId) throw new BracketNodeNotFoundError();

        const phase = await this.phaseRepository.findById(node.phaseId);
        if (!phase) throw new PhaseNotFoundError();

        if (!node.homeTeamId || !node.awayTeamId) throw new BracketNodeNotReadyError();
        if (node.matchId) throw new BracketNodeAlreadyScheduledError();

        // Se reutiliza la creación de partidos: permisos (owner/admin) y validaciones incluidas.
        const match = await this.createMatch.execute({
            tournamentId: phase.tournamentId,
            userId: input.userId,
            categoryId: phase.categoryId,
            homeTeamId: node.homeTeamId,
            awayTeamId: node.awayTeamId,
            scheduledAt: input.scheduledAt,
            venue: input.venue,
            phaseId: phase.id,
            phaseGroupId: null,
            // El repechaje no tiene jornada (la ronda 0 no es válida en un partido).
            round: node.stage === 'play_in' ? null : node.round,
        });

        const updated = await this.bracketRepository.attachMatch(node.id, match.id);
        if (!updated) {
            // Otra petición programó este cruce primero: se deshace el partido recién creado.
            await this.matchRepository.delete(match.id);
            throw new BracketNodeAlreadyScheduledError();
        }

        return { node: updated, match };
    }
}