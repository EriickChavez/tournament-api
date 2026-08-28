import { and, asc, eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matches } from './schema.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';

function toMatch(row: typeof matches.$inferSelect): Match {
    return {
        id: row.id,
        tournamentId: row.tournamentId,
        categoryId: row.categoryId,
        homeTeamId: row.homeTeamId,
        awayTeamId: row.awayTeamId,
        scheduledAt: row.scheduledAt,
        venue: row.venue,
        status: row.status as MatchStatus,
        createdByUserId: row.createdByUserId,
        updatedByUserId: row.updatedByUserId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export class DrizzleMatchRepository implements MatchRepository {
    async findById(id: string): Promise<Match | null> {
        const [row] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
        return row ? toMatch(row) : null;
    }

    async findByTournamentId(
        tournamentId: string,
        filters?: {
            categoryId?: string | undefined;
            status?: MatchStatus | undefined;
        },
    ): Promise<Match[]> {
        const conditions = [eq(matches.tournamentId, tournamentId)];
        if (filters?.categoryId) {
            conditions.push(eq(matches.categoryId, filters.categoryId));
        }
        if (filters?.status) {
            conditions.push(eq(matches.status, filters.status));
        }

        const rows = await db
            .select()
            .from(matches)
            .where(and(...conditions))
            .orderBy(asc(matches.scheduledAt));

        return rows.map(toMatch);
    }

    async create(input: {
        tournamentId: string;
        categoryId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledAt: Date;
        venue?: string | null | undefined;
        status?: MatchStatus | undefined;
        createdByUserId: string;
    }): Promise<Match> {
        const [row] = await db
            .insert(matches)
            .values({
                tournamentId: input.tournamentId,
                categoryId: input.categoryId,
                homeTeamId: input.homeTeamId,
                awayTeamId: input.awayTeamId,
                scheduledAt: input.scheduledAt,
                venue: input.venue ?? null,
                status: input.status ?? 'scheduled',
                createdByUserId: input.createdByUserId,
            })
            .returning();

        if (!row) throw new Error('Failed to create match');
        return toMatch(row);
    }

    async update(
        id: string,
        input: {
            categoryId?: string | undefined;
            homeTeamId?: string | undefined;
            awayTeamId?: string | undefined;
            scheduledAt?: Date | undefined;
            venue?: string | null | undefined;
            status?: MatchStatus | undefined;
            updatedByUserId: string;
        },
    ): Promise<Match> {
        const patch: Record<string, unknown> = {
            updatedAt: new Date(),
            updatedByUserId: input.updatedByUserId,
        };
        if (input.categoryId !== undefined) patch.categoryId = input.categoryId;
        if (input.homeTeamId !== undefined) patch.homeTeamId = input.homeTeamId;
        if (input.awayTeamId !== undefined) patch.awayTeamId = input.awayTeamId;
        if (input.scheduledAt !== undefined) patch.scheduledAt = input.scheduledAt;
        if (input.venue !== undefined) patch.venue = input.venue;
        if (input.status !== undefined) patch.status = input.status;

        const [row] = await db.update(matches).set(patch).where(eq(matches.id, id)).returning();
        if (!row) throw new Error('Failed to update match');
        return toMatch(row);
    }

    async delete(id: string): Promise<void> {
        const [row] = await db.delete(matches).where(eq(matches.id, id)).returning();
        if (!row) throw new Error('Failed to delete match');
    }
}