import { eq, asc, and, count } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import type { Phase, PhaseGroup, PhaseTeam, PhaseType, PhaseStatus } from '../../domain/entities/phase.entity.js';
import type {
    PhaseRepository,
    PhaseGroupRepository,
    PhaseTeamRepository,
} from '../../domain/repositories/phase.repository.js';
import { phases, phaseGroups, phaseTeams } from './schema.js';
import { matches } from '../../../matches/infrastructure/database/schema.js';

function mapPhase(row: typeof phases.$inferSelect): Phase {
    return {
        id: row.id,
        tournamentId: row.tournamentId,
        categoryId: row.categoryId,
        name: row.name,
        type: row.type as PhaseType,
        status: row.status as PhaseStatus,
        sortOrder: row.sortOrder,
        startDate: row.startDate,
        endDate: row.endDate,
        createdByUserId: row.createdByUserId,
        updatedByUserId: row.updatedByUserId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function mapPhaseGroup(row: typeof phaseGroups.$inferSelect): PhaseGroup {
    return {
        id: row.id,
        phaseId: row.phaseId,
        name: row.name,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function mapPhaseTeam(row: typeof phaseTeams.$inferSelect): PhaseTeam {
    return {
        id: row.id,
        phaseId: row.phaseId,
        teamId: row.teamId,
        phaseGroupId: row.phaseGroupId,
        seed: row.seed,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export class DrizzlePhaseRepository implements PhaseRepository {
    async findById(id: string): Promise<Phase | null> {
        const [row] = await db.select().from(phases).where(eq(phases.id, id)).limit(1);
        return row ? mapPhase(row) : null;
    }

    async findByCategoryId(categoryId: string): Promise<Phase[]> {
        const rows = await db
            .select()
            .from(phases)
            .where(eq(phases.categoryId, categoryId))
            .orderBy(asc(phases.sortOrder), asc(phases.createdAt));
        return rows.map(mapPhase);
    }

    async findByTournamentId(tournamentId: string): Promise<Phase[]> {
        const rows = await db
            .select()
            .from(phases)
            .where(eq(phases.tournamentId, tournamentId))
            .orderBy(asc(phases.sortOrder), asc(phases.createdAt));
        return rows.map(mapPhase);
    }

    async create(input: {
        tournamentId: string;
        categoryId: string;
        name: string;
        type: PhaseType;
        status?: PhaseStatus | undefined;
        sortOrder?: number | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
        createdByUserId: string;
    }): Promise<Phase> {
        const [row] = await db
            .insert(phases)
            .values({
                tournamentId: input.tournamentId,
                categoryId: input.categoryId,
                name: input.name,
                type: input.type,
                status: input.status ?? 'upcoming',
                sortOrder: input.sortOrder ?? 0,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
                createdByUserId: input.createdByUserId,
            })
            .returning();

        if (!row) throw new Error('Failed to create phase');
        return mapPhase(row);
    }

    async update(
        id: string,
        input: {
            name?: string | undefined;
            type?: PhaseType | undefined;
            status?: PhaseStatus | undefined;
            sortOrder?: number | undefined;
            startDate?: string | null | undefined;
            endDate?: string | null | undefined;
            updatedByUserId: string;
        },
    ): Promise<Phase> {
        const [row] = await db
            .update(phases)
            .set({
                ...(input.name !== undefined && { name: input.name }),
                ...(input.type !== undefined && { type: input.type }),
                ...(input.status !== undefined && { status: input.status }),
                ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
                ...(input.startDate !== undefined && { startDate: input.startDate }),
                ...(input.endDate !== undefined && { endDate: input.endDate }),
                updatedByUserId: input.updatedByUserId,
                updatedAt: new Date(),
            })
            .where(eq(phases.id, id))
            .returning();

        if (!row) throw new Error('Failed to update phase');
        return mapPhase(row);
    }

    async delete(id: string): Promise<void> {
        const [row] = await db.delete(phases).where(eq(phases.id, id)).returning();
        if (!row) throw new Error('Failed to delete phase');
    }

    async countMatchesByPhaseId(phaseId: string): Promise<number> {
        const [result] = await db
            .select({ value: count() })
            .from(matches)
            .where(eq(matches.phaseId, phaseId));
        return result?.value ?? 0;
    }
}

export class DrizzlePhaseGroupRepository implements PhaseGroupRepository {
    async findById(id: string): Promise<PhaseGroup | null> {
        const [row] = await db.select().from(phaseGroups).where(eq(phaseGroups.id, id)).limit(1);
        return row ? mapPhaseGroup(row) : null;
    }

    async findByPhaseId(phaseId: string): Promise<PhaseGroup[]> {
        const rows = await db
            .select()
            .from(phaseGroups)
            .where(eq(phaseGroups.phaseId, phaseId))
            .orderBy(asc(phaseGroups.sortOrder), asc(phaseGroups.createdAt));
        return rows.map(mapPhaseGroup);
    }

    async create(input: {
        phaseId: string;
        name: string;
        sortOrder?: number | undefined;
    }): Promise<PhaseGroup> {
        const [row] = await db
            .insert(phaseGroups)
            .values({
                phaseId: input.phaseId,
                name: input.name,
                sortOrder: input.sortOrder ?? 0,
            })
            .returning();

        if (!row) throw new Error('Failed to create phase group');
        return mapPhaseGroup(row);
    }

    async update(
        id: string,
        input: {
            name?: string | undefined;
            sortOrder?: number | undefined;
        },
    ): Promise<PhaseGroup> {
        const [row] = await db
            .update(phaseGroups)
            .set({
                ...(input.name !== undefined && { name: input.name }),
                ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
                updatedAt: new Date(),
            })
            .where(eq(phaseGroups.id, id))
            .returning();

        if (!row) throw new Error('Failed to update phase group');
        return mapPhaseGroup(row);
    }

    async delete(id: string): Promise<void> {
        const [row] = await db.delete(phaseGroups).where(eq(phaseGroups.id, id)).returning();
        if (!row) throw new Error('Failed to delete phase group');
    }
}

export class DrizzlePhaseTeamRepository implements PhaseTeamRepository {
    async findByPhaseId(phaseId: string): Promise<PhaseTeam[]> {
        const rows = await db
            .select()
            .from(phaseTeams)
            .where(eq(phaseTeams.phaseId, phaseId))
            .orderBy(asc(phaseTeams.seed), asc(phaseTeams.createdAt));
        return rows.map(mapPhaseTeam);
    }

    async findByPhaseAndTeam(phaseId: string, teamId: string): Promise<PhaseTeam | null> {
        const [row] = await db
            .select()
            .from(phaseTeams)
            .where(and(eq(phaseTeams.phaseId, phaseId), eq(phaseTeams.teamId, teamId)))
            .limit(1);
        return row ? mapPhaseTeam(row) : null;
    }

    async sync(
        phaseId: string,
        teams: Array<{
            teamId: string;
            phaseGroupId?: string | null | undefined;
            seed?: number | null | undefined;
        }>,
    ): Promise<PhaseTeam[]> {
        await db.delete(phaseTeams).where(eq(phaseTeams.phaseId, phaseId));

        if (teams.length === 0) return [];

        const rows = await db
            .insert(phaseTeams)
            .values(
                teams.map((t) => ({
                    phaseId,
                    teamId: t.teamId,
                    phaseGroupId: t.phaseGroupId ?? null,
                    seed: t.seed ?? null,
                })),
            )
            .returning();

        return rows.map(mapPhaseTeam);
    }

    async deleteByPhaseId(phaseId: string): Promise<void> {
        await db.delete(phaseTeams).where(eq(phaseTeams.phaseId, phaseId));
    }
}