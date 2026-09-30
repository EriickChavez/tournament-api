import { and, asc, eq, or, sql } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matches } from './schema.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';
import { Paginated, PaginationParams, toOffset } from '../../../../shared/utils/pagination.js';

function toMatch(row: typeof matches.$inferSelect): Match {
    return {
        id: row.id,
        tournamentId: row.tournamentId,
        categoryId: row.categoryId,
        homeTeamId: row.homeTeamId,
        awayTeamId: row.awayTeamId,
        phaseId: row.phaseId,
        phaseGroupId: row.phaseGroupId,
        round: row.round,
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
        pagination: PaginationParams,
        filters?: {
            categoryId?: string | undefined;
            status?: MatchStatus | undefined;
            phaseId?: string | undefined;
        },
    ): Promise<Paginated<Match>> {
        const conditions = [eq(matches.tournamentId, tournamentId)];
        if (filters?.categoryId) conditions.push(eq(matches.categoryId, filters.categoryId));
        if (filters?.status) conditions.push(eq(matches.status, filters.status));
        if (filters?.phaseId) conditions.push(eq(matches.phaseId, filters.phaseId));
        const condition = and(...conditions);

        const [rows, countRows] = await Promise.all([
            db
                .select()
                .from(matches)
                .where(condition)
                .orderBy(asc(matches.scheduledAt))
                .limit(pagination.limit)
                .offset(toOffset(pagination)),
            db.select({ count: sql<number>`count(*)::int` }).from(matches).where(condition),
        ]);

        return { items: rows.map(toMatch), total: countRows[0]?.count ?? 0 };
    }

    async create(input: {
        tournamentId: string;
        categoryId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledAt: Date;
        venue?: string | null | undefined;
        status?: MatchStatus | undefined;
        phaseId?: string | null | undefined;
        phaseGroupId?: string | null | undefined;
        round?: number | null | undefined;
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
                phaseId: input.phaseId ?? null,
                phaseGroupId: input.phaseGroupId ?? null,
                round: input.round ?? null,
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
            phaseId?: string | null | undefined;
            phaseGroupId?: string | null | undefined;
            round?: number | null | undefined;
            updatedByUserId: string;
        },
    ): Promise<Match> {
        const [row] = await db
            .update(matches)
            .set({
                ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
                ...(input.homeTeamId !== undefined && { homeTeamId: input.homeTeamId }),
                ...(input.awayTeamId !== undefined && { awayTeamId: input.awayTeamId }),
                ...(input.scheduledAt !== undefined && { scheduledAt: input.scheduledAt }),
                ...(input.venue !== undefined && { venue: input.venue }),
                ...(input.status !== undefined && { status: input.status }),
                ...(input.phaseId !== undefined && { phaseId: input.phaseId }),
                ...(input.phaseGroupId !== undefined && { phaseGroupId: input.phaseGroupId }),
                ...(input.round !== undefined && { round: input.round }),
                updatedByUserId: input.updatedByUserId,
                updatedAt: new Date(),
            })
            .where(eq(matches.id, id))
            .returning();

        if (!row) throw new Error('Failed to update match');
        return toMatch(row);
    }

    async delete(id: string): Promise<void> {
        const [row] = await db.delete(matches).where(eq(matches.id, id)).returning();
        if (!row) throw new Error('Failed to delete match');
    }

    async findFinishedByTournamentAndCategory(
        tournamentId: string,
        categoryId: string,
    ): Promise<Match[]> {
        const rows = await db
            .select()
            .from(matches)
            .where(
                and(
                    eq(matches.tournamentId, tournamentId),
                    eq(matches.categoryId, categoryId),
                    eq(matches.status, 'finished'),
                ),
            );
        return rows.map(toMatch);
    }

    async findFinishedByTournamentCategoryAndTeam(
        tournamentId: string,
        categoryId: string,
        teamId: string,
    ): Promise<Match[]> {
        const rows = await db
            .select()
            .from(matches)
            .where(
                and(
                    eq(matches.tournamentId, tournamentId),
                    eq(matches.categoryId, categoryId),
                    eq(matches.status, 'finished'),
                    or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId)),
                ),
            );
        return rows.map(toMatch);
    }
}