import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';

export class ListMatchesUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly tournamentRepository: TournamentRepository,
    ) { }

    async execute(
        tournamentId: string,
        pagination: PaginationParams,
        filters?: { categoryId?: string | undefined; status?: MatchStatus | undefined },
    ): Promise<Paginated<Match>> {
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        return this.matchRepository.findByTournamentId(tournamentId, pagination, filters);
    }
}