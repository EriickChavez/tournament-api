import { desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { tournaments, tournamentMembers } from './schema.js';
import { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import { Tournament } from '../../domain/entities/tournaments.entity.js';
import { toOffset, type PaginationParams, type Paginated } from '../../../../shared/utils/pagination.js';

export class DrizzleTournamentRepository implements TournamentRepository {
    async findById(id: string): Promise<Tournament | null> {
        const [row] = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
        return row ?? null;
    }

    async findBySlug(slug: string): Promise<Tournament | null> {
        const [row] = await db.select().from(tournaments).where(eq(tournaments.slug, slug)).limit(1);
        return row ?? null;
    }

    async findAllForUser(userId: string): Promise<Array<Tournament & { roleId: string }>> {
        const rows = await db
            .select({
                id: tournaments.id,
                name: tournaments.name,
                subtitle: tournaments.subtitle,
                description: tournaments.description,
                slug: tournaments.slug,
                startDate: tournaments.startDate,
                endDate: tournaments.endDate,
                timezone: tournaments.timezone,
                createdByUserId: tournaments.createdByUserId,
                createdAt: tournaments.createdAt,
                updatedByUserId: tournaments.updatedByUserId,
                updatedAt: tournaments.updatedAt,
                roleId: tournamentMembers.roleId,
            })
            .from(tournamentMembers)
            .innerJoin(tournaments, eq(tournamentMembers.tournamentId, tournaments.id))
            .where(eq(tournamentMembers.userId, userId));

        return rows;
    }

    async findAllPaginated(
        pagination: PaginationParams,
        search?: string | undefined,
    ): Promise<Paginated<Tournament>> {
        // ilike = LIKE case-insensitive de Postgres. Sin search, no filtramos nada.
        const condition = search ? ilike(tournaments.name, `%${search}%`) : sql`true`;

        const [items, countRows] = await Promise.all([
            db
                .select()
                .from(tournaments)
                .where(condition)
                .orderBy(desc(tournaments.createdAt))
                .limit(pagination.limit)
                .offset(toOffset(pagination)),
            db.select({ count: sql<number>`count(*)::int` }).from(tournaments).where(condition),
        ]);

        return { items, total: countRows[0]?.count ?? 0 };
    }

    async create(input: {
        name: string;
        subtitle: string | null;
        description: string | null;
        slug: string;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
        timezone?: string | undefined;
        createdByUserId: string;
    }): Promise<Tournament> {
        const [row] = await db.insert(tournaments).values(input).returning();
        if (!row) throw new Error('Failed to create tournament');
        return row;
    }

    async update(
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
    ): Promise<Tournament> {
        const [row] = await db
            .update(tournaments)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(tournaments.id, id))
            .returning();
        if (!row) throw new Error('Failed to update tournament');
        return row;
    }

    async delete(id: string): Promise<void> {
        await db.transaction(async (tx) => {
            await tx.delete(tournamentMembers).where(eq(tournamentMembers.tournamentId, id));
            const [row] = await tx.delete(tournaments).where(eq(tournaments.id, id)).returning();
            if (!row) throw new Error('Failed to delete tournament');
        });
    }
}