import { env } from '../../../../config/env.js';
import type { PhaseRepository } from '../../../phases/domain/repositories/phase.repository.js';
import type { PhaseClosureRepository } from '../../../phases/domain/repositories/phase-closure.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { PhaseNotFoundError } from '../../../phases/domain/errors/phase.errors.js';
import type { BracketNode } from '../../domain/entities/bracket-node.entity.js';
import type { BracketRepository } from '../../domain/repositories/bracket.repository.js';
import { buildBracket } from '../../domain/services/bracket-builder.js';
import {
    InvalidBracketPhaseError,
    SourcePhaseNotClosedError,
    NotEnoughQualifiedTeamsError,
    BracketInProgressError,
} from '../../domain/errors/bracket.errors.js';

export class GenerateBracketUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseClosureRepository: PhaseClosureRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly bracketRepository: BracketRepository,
    ) { }

    async execute(input: {
        phaseId: string;
        userId: string;
        sourcePhaseId: string;
        thirdPlace: boolean;
    }): Promise<BracketNode[]> {
        const phase = await this.phaseRepository.findById(input.phaseId);
        if (!phase) throw new PhaseNotFoundError();
        if (phase.type !== 'knockout') {
            throw new InvalidBracketPhaseError('The bracket can only be generated in a phase of type "knockout".');
        }

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const source = await this.phaseRepository.findById(input.sourcePhaseId);
        if (!source) throw new PhaseNotFoundError();
        if (source.type !== 'group') {
            throw new InvalidBracketPhaseError('The source phase must be of type "group".');
        }
        if (source.categoryId !== phase.categoryId || source.tournamentId !== phase.tournamentId) {
            throw new InvalidBracketPhaseError('The source phase must belong to the same category.');
        }

        const closure = await this.phaseClosureRepository.findByPhaseId(source.id);
        if (!closure) throw new SourcePhaseNotClosedError();
        if (closure.qualified.length < 2) throw new NotEnoughQualifiedTeamsError();

        // Regenerar solo se permite mientras nada haya empezado.
        const existing = await this.bracketRepository.findByPhaseId(phase.id);
        if (existing.some((node) => node.matchId !== null || node.winnerTeamId !== null)) {
            throw new BracketInProgressError();
        }

        // Seeds: por posición en el grupo, luego puntos, diferencia y goles a favor.
        // El id solo desempata para que el resultado sea siempre el mismo.
        const ranked = [...closure.qualified].sort(
            (a, b) =>
                a.position - b.position ||
                b.points - a.points ||
                b.goalDifference - a.goalDifference ||
                b.goalsFor - a.goalsFor ||
                a.teamId.localeCompare(b.teamId),
        );
        const seeds = ranked.map((item, index) => ({ teamId: item.teamId, seed: index + 1 }));

        const drafts = buildBracket(seeds, { thirdPlace: input.thirdPlace });
        return this.bracketRepository.replaceAll(phase.id, drafts);
    }
}