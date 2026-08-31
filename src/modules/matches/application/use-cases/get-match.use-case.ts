import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { MatchNotFoundError } from '../../domain/errors/match.errors.js';
import { NotTournamentMemberError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import type { MatchWithDetails } from './match-with-details.js';

/**
 * Ficha de un partido con equipos y categoría embebidos.
 * Solo miembros del torneo del partido.
 */
export class GetMatchUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly teamRepository: TeamRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: { matchId: string; userId: string }): Promise<MatchWithDetails> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            match.tournamentId,
            input.userId,
        );
        if (!member) throw new NotTournamentMemberError();

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