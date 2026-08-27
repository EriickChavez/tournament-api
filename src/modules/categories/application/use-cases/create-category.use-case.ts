import { env } from '../../../../config/env.js';
import type { Category } from '../../domain/entities/category.entity.js';
import type { CategoryRepository } from '../../domain/repositories/category.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import {
    TournamentNotFoundError,
    NotTournamentOwnerError,
} from '../../../tournaments/domain/errors/tournaments.errors.js';
import { InvalidAgeRangeError } from '../../domain/errors/category.errors.js';

export class CreateCategoryUseCase {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
        title: string;
        minAge?: number | null | undefined;
        maxAge?: number | null | undefined;
        description?: string | null | undefined;
        order?: number | undefined;
    }): Promise<Category> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        if (
            input.minAge !== undefined &&
            input.minAge !== null &&
            input.maxAge !== undefined &&
            input.maxAge !== null &&
            input.maxAge < input.minAge
        ) {
            throw new InvalidAgeRangeError();
        }

        return this.categoryRepository.create({
            tournamentId: input.tournamentId,
            title: input.title,
            minAge: input.minAge,
            maxAge: input.maxAge,
            description: input.description,
            order: input.order,
            createdByUserId: input.userId,
        });
    }
}
