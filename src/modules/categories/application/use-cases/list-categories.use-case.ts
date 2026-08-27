import type { Category } from '../../domain/entities/category.entity.js';
import type { CategoryRepository } from '../../domain/repositories/category.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';

export class ListCategoriesUseCase {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly tournamentRepository: TournamentRepository,
    ) { }

    async execute(tournamentId: string): Promise<Category[]> {
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        return this.categoryRepository.findByTournamentId(tournamentId);
    }
}
