import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matches, matchReferees } from './schema.js';
import type {
    MatchRefereeRepository,
    MyMatchesFilters,
} from '../../domain/repositories/match-referee.repository.js';
import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';
import { Paginated, PaginationParams, toOffset } from '../../../../shared/utils/pagination.js';

// Match tiene exactamente las columnas de la tabla; solo se afina el tipo de status.
function toMatch(row: typeof matches.$inferSelect): Match {
    return { ...row, status: row.status as MatchStatus };
}

export class DrizzleMatchRefereeRepository implements MatchRefereeRepository {
    async findUserIdsByMatchId(matchId: string): Promise<string[]> {
        const rows = await db
            .select({ userId: matchReferees.userId })
            .from(matchReferees)
            .where(eq(matchReferees.matchId, matchId));
        return rows.map((r) => r.userId);
    }

    async replaceForMatch(
        matchId: string,
        userIds: string[],
        assignedByUserId: string,
    ): Promise<void> {
        await db.transaction(async (tx) => {
            await tx.delete(matchReferees).where(eq(matchReferees.matchId, matchId));
            if (userIds.length > 0) {
                await tx
                    .insert(matchReferees)
                    .values(userIds.map((userId) => ({ matchId, userId, assignedByUserId })));
            }
        });
    }

    async findMatchesByUserId(
        userId: string,
        pagination: PaginationParams,
        filters?: MyMatchesFilters,
    ): Promise<Paginated<Match>> {
        const conditions = [eq(matchReferees.userId, userId)];
        if (filters?.tournamentId) conditions.push(eq(matches.tournamentId, filters.tournamentId));
        if (filters?.status) conditions.push(eq(matches.status, filters.status));
        if (filters?.from) conditions.push(gte(matches.scheduledAt, filters.from));
        if (filters?.to) conditions.push(lte(matches.scheduledAt, filters.to));
        const condition = and(...conditions);

        const [rows, countRows] = await Promise.all([
            db
                .select({ match: matches })
                .from(matchReferees)
                .innerJoin(matches, eq(matchReferees.matchId, matches.id))
                .where(condition)
                .orderBy(asc(matches.scheduledAt))
                .limit(pagination.limit)
                .offset(toOffset(pagination)),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(matchReferees)
                .innerJoin(matches, eq(matchReferees.matchId, matches.id))
                .where(condition),
        ]);

        return { items: rows.map((r) => toMatch(r.match)), total: countRows[0]?.count ?? 0 };
    }
}