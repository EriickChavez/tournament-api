import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';

export class ListMatchesUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly tournamentRepository: TournamentRepository,
    ) { }

    async execute(
        tournamentId: string,
        filters?: {
            categoryId?: string | undefined;
            status?: MatchStatus | undefined;
        },
    ): Promise<Match[]> {
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        return this.matchRepository.findByTournamentId(tournamentId, filters);
    }
}
