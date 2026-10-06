import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { categoryClosures } from './schema.js';
import type { CategoryClosure } from '../../domain/entities/category-closure.entity.js';
import type { CategoryClosureRepository } from '../../domain/repositories/category-closure.repository.js';

function mapClosure(row: typeof categoryClosures.$inferSelect): CategoryClosure {
    return {
        id: row.id,
        tournamentId: row.tournamentId,
        categoryId: row.categoryId,
        championTeamId: row.championTeamId,
        closedByUserId: row.closedByUserId,
        closedAt: row.closedAt,
    };
}

export class DrizzleCategoryClosureRepository implements CategoryClosureRepository {
    async findByCategoryId(categoryId: string): Promise<CategoryClosure | null> {
        const [row] = await db
            .select()
            .from(categoryClosures)
            .where(eq(categoryClosures.categoryId, categoryId))
            .limit(1);
        return row ? mapClosure(row) : null;
    }

    async findByTournamentId(tournamentId: string): Promise<CategoryClosure[]> {
        const rows = await db
            .select()
            .from(categoryClosures)
            .where(eq(categoryClosures.tournamentId, tournamentId));
        return rows.map(mapClosure);
    }

    async isClosed(categoryId: string): Promise<boolean> {
        const [row] = await db
            .select({ id: categoryClosures.id })
            .from(categoryClosures)
            .where(eq(categoryClosures.categoryId, categoryId))
            .limit(1);
        return row !== undefined;
    }

    async close(input: {
        tournamentId: string;
        categoryId: string;
        championTeamId: string;
        userId: string;
    }): Promise<CategoryClosure> {
        const [row] = await db
            .insert(categoryClosures)
            .values({
                tournamentId: input.tournamentId,
                categoryId: input.categoryId,
                championTeamId: input.championTeamId,
                closedByUserId: input.userId,
            })
            .returning();

        if (!row) throw new Error('Failed to close category');
        return mapClosure(row);
    }

    async delete(categoryId: string): Promise<void> {
        await db.delete(categoryClosures).where(eq(categoryClosures.categoryId, categoryId));
    }
}