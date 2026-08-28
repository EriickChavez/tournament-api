import { and, eq, desc } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { topScorers } from './schema.js';
import type { TopScorerRepository } from '../../domain/repositories/top-scorer.repository.js';
import type { TopScorer } from '../../domain/entities/top-scorer.entity.js';

export class DrizzleTopScorerRepository implements TopScorerRepository {
    async findByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<TopScorer[]> {
        return db
            .select()
            .from(topScorers)
            .where(and(eq(topScorers.tournamentId, tournamentId), eq(topScorers.categoryId, categoryId)))
            .orderBy(desc(topScorers.goals));
    }

    async upsert(input: {
        tournamentId: string;
        categoryId: string;
        playerId: string;
        goals: number;
        assists: number;
    }): Promise<TopScorer> {
        const [row] = await db
            .insert(topScorers)
            .values({ ...input, updatedAt: new Date() })
            .onConflictDoUpdate({
                target: [topScorers.tournamentId, topScorers.categoryId, topScorers.playerId],
                set: { goals: input.goals, assists: input.assists, updatedAt: new Date() },
            })
            .returning();
        if (!row) throw new Error('Failed to upsert top scorer');
        return row;
    }
}