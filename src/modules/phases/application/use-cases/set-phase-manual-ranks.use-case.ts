import { env } from '../../../../config/env.js';
import type {
    ManualRankScope,
    PhaseManualRank,
} from '../../domain/entities/phase-manual-rank.entity.js';
import type {
    PhaseRepository,
    PhaseTeamRepository,
} from '../../domain/repositories/phase.repository.js';
import type { PhaseManualRankRepository } from '../../domain/repositories/phase-manual-rank.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { PhaseNotFoundError } from '../../domain/errors/phase.errors.js';
import {
    StandingsNotAvailableError,
    TeamNotInPhaseError,
    DuplicateManualRankError,
} from '../../domain/errors/phase-standings.errors.js';

export class SetPhaseManualRanksUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseTeamRepository: PhaseTeamRepository,
        private readonly phaseManualRankRepository: PhaseManualRankRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        phaseId: string;
        userId: string;
        scope: ManualRankScope;
        ranks: Array<{ teamId: string; rank: number }>;
    }): Promise<PhaseManualRank[]> {
        const phase = await this.phaseRepository.findById(input.phaseId);
        if (!phase) throw new PhaseNotFoundError();
        if (phase.type !== 'group') throw new StandingsNotAvailableError();

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

        const phaseTeams = await this.phaseTeamRepository.findByPhaseId(phase.id);
        const groupByTeam = new Map(phaseTeams.map((pt) => [pt.teamId, pt.phaseGroupId]));

        const seenTeams = new Set<string>();
        const seenRanks = new Set<string>();
        for (const item of input.ranks) {
            if (!groupByTeam.has(item.teamId)) throw new TeamNotInPhaseError();

            // Un equipo solo puede aparecer una vez en la lista.
            if (seenTeams.has(item.teamId)) throw new DuplicateManualRankError();
            seenTeams.add(item.teamId);

            // En 'group' el número no se repite dentro del mismo grupo (cada grupo se ordena por
            // separado); en 'best_next' no se repite en toda la fase (es un solo ranking).
            const bucket =
                input.scope === 'group' ? (groupByTeam.get(item.teamId) ?? 'none') : 'all';
            const key = `${bucket}#${item.rank}`;
            if (seenRanks.has(key)) throw new DuplicateManualRankError();
            seenRanks.add(key);
        }

        return this.phaseManualRankRepository.replaceScope(phase.id, input.scope, input.ranks);
    }
}