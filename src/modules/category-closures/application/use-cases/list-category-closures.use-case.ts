import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import type { CategoryClosure } from '../../domain/entities/category-closure.entity.js';
import type { CategoryClosureRepository } from '../../domain/repositories/category-closure.repository.js';

export class ListCategoryClosuresUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly categoryClosureRepository: CategoryClosureRepository,
    ) { }

    async execute(tournamentId: string): Promise<CategoryClosure[]> {
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) throw new TournamentNotFoundError();
        return this.categoryClosureRepository.findByTournamentId(tournament.id);
    }
}