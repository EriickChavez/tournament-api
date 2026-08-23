import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { tournaments } from './schema.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository';
import type { Tournament } from '../../domain/entities/tournaments.entity';

export class DrizzleTournamentRepository implements TournamentRepository {
    async findBySlug(slug: string): Promise<Tournament | null> {
        const [row] = await db.select().from(tournaments).where(eq(tournaments.slug, slug)).limit(1);
        return row ?? null;
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
}
