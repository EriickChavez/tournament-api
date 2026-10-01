import { and, eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { phaseManualRanks } from './schema.js';
import type {
    ManualRankScope,
    PhaseManualRank,
} from '../../domain/entities/phase-manual-rank.entity.js';
import type { PhaseManualRankRepository } from '../../domain/repositories/phase-manual-rank.repository.js';

function mapRank(row: typeof phaseManualRanks.$inferSelect): PhaseManualRank {
    return {
        id: row.id,
        phaseId: row.phaseId,
        teamId: row.teamId,
        scope: row.scope as ManualRankScope,
        rank: row.rank,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export class DrizzlePhaseManualRankRepository implements PhaseManualRankRepository {
    async findByPhaseId(phaseId: string): Promise<PhaseManualRank[]> {
        const rows = await db
            .select()
            .from(phaseManualRanks)
            .where(eq(phaseManualRanks.phaseId, phaseId));
        return rows.map(mapRank);
    }

    async replaceScope(
        phaseId: string,
        scope: ManualRankScope,
        ranks: Array<{ teamId: string; rank: number }>,
    ): Promise<PhaseManualRank[]> {
        await db.transaction(async (tx) => {
            await tx
                .delete(phaseManualRanks)
                .where(and(eq(phaseManualRanks.phaseId, phaseId), eq(phaseManualRanks.scope, scope)));

            if (ranks.length > 0) {
                await tx.insert(phaseManualRanks).values(
                    ranks.map((item) => ({
                        phaseId,
                        teamId: item.teamId,
                        scope,
                        rank: item.rank,
                    })),
                );
            }
        });

        return this.findByPhaseId(phaseId);
    }
}