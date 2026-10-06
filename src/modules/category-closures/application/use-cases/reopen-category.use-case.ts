import { env } from '../../../../config/env.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { CategoryNotFoundError } from '../../../categories/domain/errors/category.errors.js';
import type { CategoryClosureRepository } from '../../domain/repositories/category-closure.repository.js';
import { CategoryNotClosedError } from '../../domain/errors/category-closure.errors.js';

export class ReopenCategoryUseCase {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryClosureRepository: CategoryClosureRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        categoryId: string;
        userId: string;
    }): Promise<void> {
        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category || category.tournamentId !== input.tournamentId) {
            throw new CategoryNotFoundError();
        }

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        if (!(await this.categoryClosureRepository.isClosed(category.id))) {
            throw new CategoryNotClosedError();
        }

        await this.categoryClosureRepository.delete(category.id);
    }
}