import type {
    MatchRefereeRepository,
    MyMatchesFilters,
} from '../../domain/repositories/match-referee.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';
import type { MatchWithDetails } from './match-with-details.js';

export class ListMyMatchesUseCase {
    constructor(
        private readonly matchRefereeRepository: MatchRefereeRepository,
        private readonly teamRepository: TeamRepository,
        private readonly categoryRepository: CategoryRepository,
    ) { }

    async execute(
        userId: string,
        pagination: PaginationParams,
        filters?: MyMatchesFilters,
    ): Promise<Paginated<MatchWithDetails>> {
        const { items, total } = await this.matchRefereeRepository.findMatchesByUserId(
            userId,
            pagination,
            filters,
        );
        if (items.length === 0) return { items: [], total };

        const [teams, categories] = await Promise.all([
            this.teamRepository.findByIds(items.flatMap((m) => [m.homeTeamId, m.awayTeamId])),
            this.categoryRepository.findByIds(items.map((m) => m.categoryId)),
        ]);
        const teamById = new Map(teams.map((t) => [t.id, t]));
        const categoryById = new Map(categories.map((c) => [c.id, c]));

        const enriched = items.map((match): MatchWithDetails => {
            const homeTeam = teamById.get(match.homeTeamId);
            const awayTeam = teamById.get(match.awayTeamId);
            const category = categoryById.get(match.categoryId);
            if (!homeTeam || !awayTeam || !category) {
                throw new Error(`Match ${match.id} has missing homeTeam/awayTeam/category relations.`);
            }
            return { ...match, homeTeam, awayTeam, category };
        });

        return { items: enriched, total };
    }
}