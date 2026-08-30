import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';

/**
 * Listado público de torneos (sin autenticación). "search" es opcional:
 * sin él, es un listado completo; con él, filtra por nombre.
 */
export class ListPublicTournamentsUseCase {
    constructor(private readonly tournamentRepository: TournamentRepository) { }

    async execute(pagination: PaginationParams, search?: string | undefined): Promise<Paginated<Tournament>> {
        return this.tournamentRepository.findAllPaginated(pagination, search);
    }
}