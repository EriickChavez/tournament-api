import type { MatchStatus } from '../../domain/entities/match.entity.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';
import type { MatchWithDetails } from './match-with-details.js';

export class ListMatchesUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly teamRepository: TeamRepository,
        private readonly categoryRepository: CategoryRepository,
    ) { }

    async execute(
        tournamentId: string,
        pagination: PaginationParams,
        filters?: { categoryId?: string | undefined; status?: MatchStatus | undefined },
    ): Promise<Paginated<MatchWithDetails>> {
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const { items, total } = await this.matchRepository.findByTournamentId(
            tournamentId,
            pagination,
            filters,
        );

        if (items.length === 0) {
            return { items: [], total };
        }

        const teamIds = items.flatMap((m) => [m.homeTeamId, m.awayTeamId]);
        const categoryIds = items.map((m) => m.categoryId);

        const [teams, categories] = await Promise.all([
            this.teamRepository.findByIds(teamIds),
            this.categoryRepository.findByIds(categoryIds),
        ]);

        const teamById = new Map(teams.map((t) => [t.id, t]));
        const categoryById = new Map(categories.map((c) => [c.id, c]));

        const enriched: MatchWithDetails[] = items.map((match) => {
            const homeTeam = teamById.get(match.homeTeamId);
            const awayTeam = teamById.get(match.awayTeamId);
            const category = categoryById.get(match.categoryId);

            if (!homeTeam || !awayTeam || !category) {
                throw new Error(
                    `Match ${match.id} has missing homeTeam/awayTeam/category relations.`,
                );
            }

            return { ...match, homeTeam, awayTeam, category };
        });

        return { items: enriched, total };
    }
}