import { env } from '../../../../config/env.js';
import type { CategoryRepository } from '../../domain/repositories/category.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { CategoryNotFoundError } from '../../domain/errors/category.errors.js';

export class DeleteCategoryUseCase {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: { categoryId: string; userId: string }): Promise<void> {
        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category) throw new CategoryNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            category.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        await this.categoryRepository.delete(input.categoryId);
    }
}
