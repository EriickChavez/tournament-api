import type { Team } from '../../domain/entities/team.entity.js';
import type { TeamRepository } from '../../domain/repositories/team.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';

export class ListTeamsUseCase {
    constructor(
        private readonly teamRepository: TeamRepository,
        private readonly tournamentRepository: TournamentRepository,
    ) { }

    async execute(
        tournamentId: string,
        pagination: PaginationParams,
        filters?: { categoryId?: string },
    ): Promise<Paginated<Team>> {
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        return this.teamRepository.findByTournamentId(tournamentId, pagination, filters);
    }
}