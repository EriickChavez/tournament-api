import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { CategoryClosureRepository } from '../../../category-closures/domain/repositories/category-closure.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import type { CompetitionStateRepository } from '../../domain/repositories/competition-state.repository.js';
import {
    deriveTournamentState,
    type CategoryState,
} from '../../domain/entities/category-state.js';

export interface CompetitionState {
    tournamentState: CategoryState;
    categories: Array<{ categoryId: string; state: CategoryState }>;
}

export class GetCompetitionStateUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly competitionStateRepository: CompetitionStateRepository,
        private readonly categoryClosureRepository: CategoryClosureRepository,
    ) { }

    async execute(tournamentId: string): Promise<CompetitionState> {
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        // Dos consultas para todo el torneo (en vez de dos por categoría).
        const [categories, startedIds, closures] = await Promise.all([
            this.categoryRepository.findByTournamentId(tournamentId),
            this.competitionStateRepository.findStartedCategoryIds(tournamentId),
            this.categoryClosureRepository.findByTournamentId(tournamentId),
        ]);

        const started = new Set(startedIds);
        const closed = new Set(closures.map((closure) => closure.categoryId));

        const result = categories.map((category) => {
            const state: CategoryState = closed.has(category.id)
                ? 'finished'
                : started.has(category.id)
                    ? 'in_progress'
                    : 'not_started';
            return { categoryId: category.id, state };
        });

        return {
            tournamentState: deriveTournamentState(result.map((item) => item.state)),
            categories: result,
        };
    }
}