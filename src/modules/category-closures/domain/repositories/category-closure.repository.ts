import type { CategoryClosure } from '../entities/category-closure.entity.js';

export interface CategoryClosureRepository {
    findByCategoryId(categoryId: string): Promise<CategoryClosure | null>;
    findByTournamentId(tournamentId: string): Promise<CategoryClosure[]>;
    isClosed(categoryId: string): Promise<boolean>;
    close(input: {
        tournamentId: string;
        categoryId: string;
        championTeamId: string;
        userId: string;
    }): Promise<CategoryClosure>;
    /** Reabre el campeonato: borra el cierre. */
    delete(categoryId: string): Promise<void>;
}