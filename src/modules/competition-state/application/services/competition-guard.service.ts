import type { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';
import type { CategoryClosureRepository } from '../../../category-closures/domain/repositories/category-closure.repository.js';
import type { CompetitionStateRepository } from '../../domain/repositories/competition-state.repository.js';
import type { CategoryState } from '../../domain/entities/category-state.js';
import {
    CategoryStartedError,
    CategoryFinishedError,
} from '../../domain/errors/competition-state.errors.js';

export class CompetitionGuardService implements CompetitionGuard {
    constructor(
        private readonly competitionStateRepository: CompetitionStateRepository,
        private readonly categoryClosureRepository: CategoryClosureRepository,
    ) { }

    async getCategoryState(categoryId: string): Promise<CategoryState> {
        // Primero el cierre (una sola consulta barata); los partidos solo si no está cerrado.
        if (await this.categoryClosureRepository.isClosed(categoryId)) return 'finished';
        return (await this.competitionStateRepository.hasPlayedMatches(categoryId))
            ? 'in_progress'
            : 'not_started';
    }

    async assertRosterOpen(categoryId: string): Promise<void> {
        const state = await this.getCategoryState(categoryId);
        if (state === 'finished') throw new CategoryFinishedError();
        if (state === 'in_progress') throw new CategoryStartedError();
    }

    async assertRosterEditable(categoryId: string): Promise<void> {
        if (await this.categoryClosureRepository.isClosed(categoryId)) {
            throw new CategoryFinishedError();
        }
    }
}