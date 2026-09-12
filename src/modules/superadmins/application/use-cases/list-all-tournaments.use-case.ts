import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';
import type { Tournament } from '../../../tournaments/domain/entities/tournaments.entity.js';

export class ListAllTournamentsUseCase {
    constructor(private readonly tournamentRepository: TournamentRepository) { }

    async execute(
        pagination: PaginationParams,
        search?: string | undefined,
    ): Promise<Paginated<Tournament>> {
        return this.tournamentRepository.findAllPaginated(pagination, search);
    }
}