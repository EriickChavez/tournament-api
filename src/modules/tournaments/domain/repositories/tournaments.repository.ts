import type { Tournament } from '../entities/tournaments.entity';
import type { PaginationParams, Paginated } from '../../../../shared/utils/pagination.js';

export interface TournamentRepository {
    findById(id: string): Promise<Tournament | null>;
    findBySlug(slug: string): Promise<Tournament | null>;
    findAllForUser(userId: string): Promise<Array<Tournament & { roleId: string }>>;
    /** Listado público paginado, con búsqueda opcional por nombre. */
    findAllPaginated(
        pagination: PaginationParams,
        search?: string | undefined,
    ): Promise<Paginated<Tournament>>;
    create(input: {
        name: string;
        subtitle: string | null;
        description: string | null;
        slug: string;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
        timezone?: string | undefined;
        createdByUserId: string;
    }): Promise<Tournament>;
    update(
        id: string,
        input: {
            name?: string | undefined;
            subtitle?: string | null | undefined;
            description?: string | null | undefined;
            slug?: string | undefined;
            startDate?: string | null | undefined;
            endDate?: string | null | undefined;
            timezone?: string | undefined;
            updatedByUserId: string;
        },
    ): Promise<Tournament>;
    delete(id: string, userId: string): Promise<void>;
}