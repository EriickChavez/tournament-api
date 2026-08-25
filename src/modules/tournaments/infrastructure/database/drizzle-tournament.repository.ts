import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { tournaments, tournamentMembers } from './schema.js';
import { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import { Tournament } from '../../domain/entities/tournaments.entity.js';


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

    async create(input: {
        name: string;
        subtitle: string | null;
        description: string | null;
        slug: string;
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
}