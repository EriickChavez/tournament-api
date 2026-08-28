import { env } from '../../../../config/env.js';
import type { Player } from '../../domain/entities/player.entity.js';
import type { PlayerRepository } from '../../domain/repositories/player.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import {
    TournamentNotFoundError,
    NotTournamentOwnerError,
} from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    JerseyNumberAlreadyInUseError,
    InvalidCategoryForPlayerError,
    InvalidTeamForPlayerError,
} from '../../domain/errors/player.errors.js';

export class CreatePlayerUseCase {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly teamRepository: TeamRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
        categoryId: string;
        teamId: string;
        firstName: string;
        lastName: string;
        birthDate?: string | undefined;
        number: number;
        isCaptain?: boolean | undefined;
        role?: string | undefined;
    }): Promise<Player> {
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
            throw new InvalidCategoryForPlayerError();
        }

        const team = await this.teamRepository.findById(input.teamId);
        if (
            !team ||
            team.tournamentId !== input.tournamentId ||
            team.categoryId !== input.categoryId
        ) {
            throw new InvalidTeamForPlayerError();
        }

        const existing = await this.playerRepository.findByTournamentAndNumber(
            input.tournamentId,
            input.number,
        );
        if (existing) throw new JerseyNumberAlreadyInUseError(input.number);

        return this.playerRepository.create({
            tournamentId: input.tournamentId,
            categoryId: input.categoryId,
            teamId: input.teamId,
            firstName: input.firstName,
            lastName: input.lastName,
            birthDate: input.birthDate,
            number: input.number,
            isCaptain: input.isCaptain,
            role: input.role,
            createdByUserId: input.userId,
        });
    }
}