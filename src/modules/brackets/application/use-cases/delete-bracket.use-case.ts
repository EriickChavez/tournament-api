import { env } from '../../../../config/env.js';
import type { PhaseRepository } from '../../../phases/domain/repositories/phase.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { PhaseNotFoundError } from '../../../phases/domain/errors/phase.errors.js';
import type { BracketRepository } from '../../domain/repositories/bracket.repository.js';
import {
    InvalidBracketPhaseError,
    BracketInProgressError,
} from '../../domain/errors/bracket.errors.js';

export class DeleteBracketUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly bracketRepository: BracketRepository,
    ) { }

    async execute(input: { phaseId: string; userId: string }): Promise<void> {
        const phase = await this.phaseRepository.findById(input.phaseId);
        if (!phase) throw new PhaseNotFoundError();
        if (phase.type !== 'knockout') {
            throw new InvalidBracketPhaseError('Only a phase of type "knockout" has a bracket.');
        }

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const nodes = await this.bracketRepository.findByPhaseId(phase.id);
        // Si no hay llave no hay nada que borrar: no es un error.
        if (nodes.length === 0) return;

        // Igual que al regenerar: una llave con partidos o resultados no se puede borrar.
        if (
            nodes.some(
                (node) =>
                    node.matchId !== null ||
                    node.secondLegMatchId !== null ||
                    node.winnerTeamId !== null,
            )
        ) {
            throw new BracketInProgressError();
        }

        await this.bracketRepository.deleteByPhaseId(phase.id);
    }
}