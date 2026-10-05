import { env } from '../../../../config/env.js';
import type { PhaseRepository } from '../../../phases/domain/repositories/phase.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { PhaseNotFoundError } from '../../../phases/domain/errors/phase.errors.js';
import type { BracketNode } from '../../domain/entities/bracket-node.entity.js';
import type { BracketRepository } from '../../domain/repositories/bracket.repository.js';
import { BracketNodeNotFoundError } from '../../domain/errors/bracket.errors.js';
import type { BracketAdvancer } from '../services/bracket-advancer.service.js';

export class SetBracketNodePenaltiesUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly bracketRepository: BracketRepository,
        private readonly bracketAdvancer: BracketAdvancer,
    ) { }

    async execute(input: {
        phaseId: string;
        nodeId: string;
        userId: string;
        /** null borra los penales del cruce. */
        penalties: { home: number; away: number } | null;
    }): Promise<BracketNode> {
        const node = await this.bracketRepository.findById(input.nodeId);
        if (!node || node.phaseId !== input.phaseId) throw new BracketNodeNotFoundError();

        const phase = await this.phaseRepository.findById(node.phaseId);
        if (!phase) throw new PhaseNotFoundError();

        // Mismo permiso que capturar el resultado de un partido: owner o admin.
        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (
            !member ||
            (member.roleId !== env.OWNER_ROLE_ID && member.roleId !== env.ADMIN_ROLE_ID)
        ) {
            throw new NotTournamentOwnerOrAdminError();
        }

        await this.bracketAdvancer.applyNodePenalties(node, input.penalties);

        const updated = await this.bracketRepository.findById(node.id);
        if (!updated) throw new BracketNodeNotFoundError();
        return updated;
    }
}