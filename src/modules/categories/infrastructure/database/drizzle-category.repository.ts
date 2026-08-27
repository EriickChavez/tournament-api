import { asc, eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { categories } from './schema.js';
import type { CategoryRepository } from '../../domain/repositories/category.repository.js';
import type { Category } from '../../domain/entities/category.entity.js';

export class DrizzleCategoryRepository implements CategoryRepository {
    async findById(id: string): Promise<Category | null> {
        const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
        return row ?? null;
    }

    async findByTournamentId(tournamentId: string): Promise<Category[]> {
        return db
            .select()
            .from(categories)
            .where(eq(categories.tournamentId, tournamentId))
            .orderBy(asc(categories.order), asc(categories.createdAt));
    }

    async create(input: {
        tournamentId: string;
        title: string;
        minAge?: number | null | undefined;
        maxAge?: number | null | undefined;
        description?: string | null | undefined;
        order?: number | undefined;
        createdByUserId: string;
    }): Promise<Category> {
        const [row] = await db
            .insert(categories)
            .values({
                tournamentId: input.tournamentId,
                title: input.title,
                minAge: input.minAge ?? null,
                maxAge: input.maxAge ?? null,
                description: input.description ?? null,
                order: input.order ?? 0,
                createdByUserId: input.createdByUserId,
            })
            .returning();

        if (!row) throw new Error('Failed to create category');
        return row;
    }

    async update(
        id: string,
        input: {
            title?: string | undefined;
            minAge?: number | null | undefined;
            maxAge?: number | null | undefined;
            description?: string | null | undefined;
            order?: number | undefined;
            updatedByUserId: string;
        },
    ): Promise<Category> {
        const [row] = await db
            .update(categories)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(eq(categories.id, id))
            .returning();

        if (!row) throw new Error('Failed to update category');
        return row;
    }

    async delete(id: string): Promise<void> {
        const [row] = await db.delete(categories).where(eq(categories.id, id)).returning();
        if (!row) throw new Error('Failed to delete category');
    }
}
