import type { Category } from '../entities/category.entity.js';

export interface CategoryRepository {
    findById(id: string): Promise<Category | null>;
    findByIds(ids: string[]): Promise<Category[]>;
    findByTournamentId(tournamentId: string): Promise<Category[]>;
    create(input: {
        tournamentId: string;
        title: string;
        minAge?: number | null | undefined;
        maxAge?: number | null | undefined;
        description?: string | null | undefined;
        order?: number | undefined;
        createdByUserId: string;
    }): Promise<Category>;
    update(
        id: string,
        input: {
            title?: string | undefined;
            minAge?: number | null | undefined;
            maxAge?: number | null | undefined;
            description?: string | null | undefined;
            order?: number | undefined;
            updatedByUserId: string;
        },
    ): Promise<Category>;
    delete(id: string): Promise<void>;
}
