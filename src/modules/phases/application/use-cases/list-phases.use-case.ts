import type { Phase } from '../../domain/entities/phase.entity.js';
import type { PhaseRepository } from '../../domain/repositories/phase.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import { CategoryNotFoundError } from '../../../categories/domain/errors/category.errors.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';

export class ListPhasesUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly tournamentRepository: TournamentRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        categoryId: string;
    }): Promise<Phase[]> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category || category.tournamentId !== input.tournamentId) {
            throw new CategoryNotFoundError();
        }

        return this.phaseRepository.findByCategoryId(input.categoryId);
    }
}