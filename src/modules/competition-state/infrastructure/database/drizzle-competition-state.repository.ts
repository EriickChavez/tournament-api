import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matches } from '../../../matches/infrastructure/database/schema.js';
import type { CompetitionStateRepository } from '../../domain/repositories/competition-state.repository.js';

// Un partido "programado", cancelado o pospuesto no cuenta como torneo empezado.
const PLAYED_STATUSES = ['in_progress', 'finished'];

export class DrizzleCompetitionStateRepository implements CompetitionStateRepository {
    async hasPlayedMatches(categoryId: string): Promise<boolean> {
        const [row] = await db
            .select({ id: matches.id })
            .from(matches)
            .where(and(eq(matches.categoryId, categoryId), inArray(matches.status, PLAYED_STATUSES)))
            .limit(1);
        return row !== undefined;
    }

    async findStartedCategoryIds(tournamentId: string): Promise<string[]> {
        const rows = await db
            .selectDistinct({ categoryId: matches.categoryId })
            .from(matches)
            .where(
                and(eq(matches.tournamentId, tournamentId), inArray(matches.status, PLAYED_STATUSES)),
            );
        return rows.map((row) => row.categoryId);
    }
}