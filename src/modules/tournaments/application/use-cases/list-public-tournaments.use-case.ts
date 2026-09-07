import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { BrandingRepository } from '../../../branding/domain/repositories/branding.repository.js';
import type { TournamentBranding } from '../../../branding/domain/entities/branding.entity.js';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';

/**
 * Listado público de torneos (sin autenticación). "search" es opcional:
 * sin él, es un listado completo; con él, filtra por nombre.
 * Incluye branding de cada torneo.
 */
export class ListPublicTournamentsUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly brandingRepository: BrandingRepository,
    ) { }

    async execute(
        pagination: PaginationParams,
        search?: string | undefined,
    ): Promise<Paginated<Tournament & { branding: TournamentBranding | null }>> {
        const result = await this.tournamentRepository.findAllPaginated(pagination, search);
        if (result.items.length === 0) {
            return { items: [], total: result.total };
        }

        const brandings = await this.brandingRepository.findByTournamentIds(
            result.items.map((t) => t.id),
        );
        const brandingByTournamentId = new Map(
            brandings.map((b) => [b.tournamentId, b]),
        );

        return {
            items: result.items.map((tournament) => ({
                ...tournament,
                branding: brandingByTournamentId.get(tournament.id) ?? null,
            })),
            total: result.total,
        };
    }
}