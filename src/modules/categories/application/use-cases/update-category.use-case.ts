import { env } from '../../../../config/env.js';
import type { Category } from '../../domain/entities/category.entity.js';
import type { CategoryRepository } from '../../domain/repositories/category.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    CategoryNotFoundError,
    InvalidAgeRangeError,
} from '../../domain/errors/category.errors.js';

export class UpdateCategoryUseCase {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        categoryId: string;
        userId: string;
        title?: string | undefined;
        minAge?: number | null | undefined;
        maxAge?: number | null | undefined;
        description?: string | null | undefined;
        order?: number | undefined;
    }): Promise<Category> {
        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category) throw new CategoryNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            category.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const effectiveMinAge = input.minAge !== undefined ? input.minAge : category.minAge;
        const effectiveMaxAge = input.maxAge !== undefined ? input.maxAge : category.maxAge;

        if (
            effectiveMinAge !== null &&
            effectiveMaxAge !== null &&
            effectiveMaxAge < effectiveMinAge
        ) {
            throw new InvalidAgeRangeError();
        }

        return this.categoryRepository.update(input.categoryId, {
            title: input.title,
            minAge: input.minAge,
            maxAge: input.maxAge,
            description: input.description,
            order: input.order,
            updatedByUserId: input.userId,
        });
    }
}
