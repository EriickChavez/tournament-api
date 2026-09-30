import { env } from '../../../../config/env.js';
import type { PhaseTeam } from '../../domain/entities/phase.entity.js';
import type {
    PhaseRepository,
    PhaseGroupRepository,
    PhaseTeamRepository,
} from '../../domain/repositories/phase.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    PhaseNotFoundError,
    PhaseGroupNotFoundError,
    TeamNotInCategoryError,
} from '../../domain/errors/phase.errors.js';

export class SyncPhaseTeamsUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseGroupRepository: PhaseGroupRepository,
        private readonly phaseTeamRepository: PhaseTeamRepository,
        private readonly teamRepository: TeamRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        phaseId: string;
        userId: string;
        teams: Array<{
            teamId: string;
            phaseGroupId?: string | null | undefined;
            seed?: number | null | undefined;
        }>;
    }): Promise<PhaseTeam[]> {
        const phase = await this.phaseRepository.findById(input.phaseId);
        if (!phase) throw new PhaseNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            phase.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        if (input.teams.length > 0) {
            const teamIds = input.teams.map((t) => t.teamId);
            const teams = await this.teamRepository.findByIds(teamIds);

            if (teams.length !== new Set(teamIds).size) {
                throw new TeamNotInCategoryError();
            }

            for (const team of teams) {
                if (team.categoryId !== phase.categoryId) {
                    throw new TeamNotInCategoryError();
                }
            }
        }

        const groupIds = [
            ...new Set(
                input.teams
                    .map((t) => t.phaseGroupId)
                    .filter((id): id is string => id != null),
            ),
        ];

        if (groupIds.length > 0) {
            if (phase.type !== 'group') {
                throw new PhaseGroupNotFoundError();
            }
            const groups = await this.phaseGroupRepository.findByPhaseId(input.phaseId);
            const validGroupIds = new Set(groups.map((g) => g.id));
            for (const gid of groupIds) {
                if (!validGroupIds.has(gid)) {
                    throw new PhaseGroupNotFoundError();
                }
            }
        }

        return this.phaseTeamRepository.sync(input.phaseId, input.teams);
    }
}