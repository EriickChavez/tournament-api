import { env } from '../../../../config/env.js';
import type { Team } from '../../domain/entities/team.entity.js';
import type { TeamRepository } from '../../domain/repositories/team.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import {
    TournamentNotFoundError,
    NotTournamentOwnerError,
} from '../../../tournaments/domain/errors/tournaments.errors.js';
import { TeamNameAlreadyInUseError, InvalidCategoryForTeamError } from '../../domain/errors/team.errors.js';

export class CreateTeamUseCase {
    constructor(
        private readonly teamRepository: TeamRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryRepository: CategoryRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
        categoryId: string;
        name: string;
        abbreviation?: string | undefined;
        logoUrl?: string | undefined;
    }): Promise<Team> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category || category.tournamentId !== input.tournamentId) {
            throw new InvalidCategoryForTeamError();
        }

        const existing = await this.teamRepository.findByTournamentAndName(input.tournamentId, input.name);
        if (existing) throw new TeamNameAlreadyInUseError(input.name);

        return this.teamRepository.create({
            tournamentId: input.tournamentId,
            categoryId: input.categoryId,
            name: input.name,
            abbreviation: input.abbreviation,
            logoUrl: input.logoUrl,
        });
    }
}