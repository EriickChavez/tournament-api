import { and, eq, desc } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { cardCounts } from './schema.js';
import type { CardCountRepository } from '../../domain/repositories/card-count.repository.js';
import type { CardCount } from '../../domain/entities/card-count.entity.js';

export class DrizzleCardCountRepository implements CardCountRepository {
    async findByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<CardCount[]> {
        return db
            .select()
            .from(cardCounts)
            .where(and(eq(cardCounts.tournamentId, tournamentId), eq(cardCounts.categoryId, categoryId)))
            .orderBy(desc(cardCounts.redCards), desc(cardCounts.yellowCards));
    }

    async upsert(input: {
        tournamentId: string;
        categoryId: string;
        playerId: string;
        yellowCards: number;
        redCards: number;
    }): Promise<CardCount> {
        const [row] = await db
            .insert(cardCounts)
            .values({ ...input, updatedAt: new Date() })
            .onConflictDoUpdate({
                target: [cardCounts.tournamentId, cardCounts.categoryId, cardCounts.playerId],
                set: { yellowCards: input.yellowCards, redCards: input.redCards, updatedAt: new Date() },
            })
            .returning();
        if (!row) throw new Error('Failed to upsert card count');
        return row;
    }
}