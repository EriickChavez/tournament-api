import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { phases, phaseClosures, phaseQualifiedTeams } from './schema.js';
import type {
    PhaseClosure,
    PhaseClosureDetails,
    PhaseQualifiedTeam,
    QualifiedVia,
} from '../../domain/entities/phase-closure.entity.js';
import type {
    ClosePhaseInput,
    PhaseClosureRepository,
} from '../../domain/repositories/phase-closure.repository.js';

function mapClosure(row: typeof phaseClosures.$inferSelect): PhaseClosure {
    return {
        id: row.id,
        phaseId: row.phaseId,
        qualifiersPerGroup: row.qualifiersPerGroup,
        bestNextCount: row.bestNextCount,
        closedByUserId: row.closedByUserId,
        closedAt: row.closedAt,
    };
}

function mapQualified(row: typeof phaseQualifiedTeams.$inferSelect): PhaseQualifiedTeam {
    return {
        id: row.id,
        phaseId: row.phaseId,
        teamId: row.teamId,
        phaseGroupId: row.phaseGroupId,
        position: row.position,
        via: row.via as QualifiedVia,
        points: row.points,
        goalDifference: row.goalDifference,
        goalsFor: row.goalsFor,
        createdAt: row.createdAt,
    };
}

export class DrizzlePhaseClosureRepository implements PhaseClosureRepository {
    async findByPhaseId(phaseId: string): Promise<PhaseClosureDetails | null> {
        const [closureRow] = await db
            .select()
            .from(phaseClosures)
            .where(eq(phaseClosures.phaseId, phaseId))
            .limit(1);
        if (!closureRow) return null;

        const qualifiedRows = await db
            .select()
            .from(phaseQualifiedTeams)
            .where(eq(phaseQualifiedTeams.phaseId, phaseId))
            .orderBy(
                asc(phaseQualifiedTeams.position),
                desc(phaseQualifiedTeams.points),
                desc(phaseQualifiedTeams.goalDifference),
                desc(phaseQualifiedTeams.goalsFor),
            );

        return {
            closure: mapClosure(closureRow),
            qualified: qualifiedRows.map(mapQualified),
        };
    }

    async close(input: ClosePhaseInput): Promise<PhaseClosureDetails> {
        await db.transaction(async (tx) => {
            // Por si quedó un cierre previo: siempre se parte limpio.
            await tx.delete(phaseQualifiedTeams).where(eq(phaseQualifiedTeams.phaseId, input.phaseId));
            await tx.delete(phaseClosures).where(eq(phaseClosures.phaseId, input.phaseId));

            await tx.insert(phaseClosures).values({
                phaseId: input.phaseId,
                qualifiersPerGroup: input.qualifiersPerGroup,
                bestNextCount: input.bestNextCount,
                closedByUserId: input.userId,
            });

            if (input.qualified.length > 0) {
                await tx.insert(phaseQualifiedTeams).values(
                    input.qualified.map((item) => ({
                        phaseId: input.phaseId,
                        teamId: item.teamId,
                        phaseGroupId: item.phaseGroupId,
                        position: item.position,
                        via: item.via,
                        points: item.points,
                        goalDifference: item.goalDifference,
                        goalsFor: item.goalsFor,
                    })),
                );
            }

            await tx
                .update(phases)
                .set({ status: 'finished', updatedByUserId: input.userId, updatedAt: new Date() })
                .where(eq(phases.id, input.phaseId));
        });

        const details = await this.findByPhaseId(input.phaseId);
        if (!details) throw new Error('Failed to close phase');
        return details;
    }

    async reopen(phaseId: string, userId: string): Promise<void> {
        await db.transaction(async (tx) => {
            await tx.delete(phaseQualifiedTeams).where(eq(phaseQualifiedTeams.phaseId, phaseId));
            await tx.delete(phaseClosures).where(eq(phaseClosures.phaseId, phaseId));
            await tx
                .update(phases)
                .set({ status: 'active', updatedByUserId: userId, updatedAt: new Date() })
                .where(eq(phases.id, phaseId));
        });
    }
}