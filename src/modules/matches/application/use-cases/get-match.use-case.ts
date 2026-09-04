import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import { MatchNotFoundError } from '../../domain/errors/match.errors.js';
import type { MatchWithDetails } from './match-with-details.js';

/**
 * Ficha de un partido con equipos y categoría embebidos.
 * Lectura pública: no requiere membership.
 */
export class GetMatchUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly teamRepository: TeamRepository,
        private readonly categoryRepository: CategoryRepository,
    ) { }

    async execute(input: { matchId: string }): Promise<MatchWithDetails> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const [homeTeam, awayTeam, category] = await Promise.all([
            this.teamRepository.findById(match.homeTeamId),
            this.teamRepository.findById(match.awayTeamId),
            this.categoryRepository.findById(match.categoryId),
        ]);

        if (!homeTeam || !awayTeam || !category) {
            throw new MatchNotFoundError();
        }

        return { ...match, homeTeam, awayTeam, category };
    }
}