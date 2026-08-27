import { env } from '../../../../config/env.js';
import type { Team } from '../../domain/entities/team.entity.js';
import type { TeamRepository } from '../../domain/repositories/team.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    TeamNotFoundError,
    TeamNameAlreadyInUseError,
    InvalidCategoryForTeamError,
} from '../../domain/errors/team.errors.js';

export class UpdateTeamUseCase {
    constructor(
        private readonly teamRepository: TeamRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryRepository: CategoryRepository,
    ) { }

    async execute(input: {
        teamId: string;
        userId: string;
        categoryId?: string | undefined;
        name?: string | undefined;
        abbreviation?: string | undefined;
        logoUrl?: string | undefined;
    }): Promise<Team> {
        const team = await this.teamRepository.findById(input.teamId);
        if (!team) throw new TeamNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            team.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        if (input.categoryId) {
            const category = await this.categoryRepository.findById(input.categoryId);
            if (!category || category.tournamentId !== team.tournamentId) {
                throw new InvalidCategoryForTeamError();
            }
        }

        if (input.name && input.name !== team.name) {
            const existing = await this.teamRepository.findByTournamentAndName(team.tournamentId, input.name);
            if (existing && existing.id !== team.id) {
                throw new TeamNameAlreadyInUseError(input.name);
            }
        }

        return this.teamRepository.update(input.teamId, {
            categoryId: input.categoryId,
            name: input.name,
            abbreviation: input.abbreviation,
            logoUrl: input.logoUrl,
        });
    }
}