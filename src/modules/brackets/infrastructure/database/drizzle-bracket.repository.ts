import { randomUUID } from 'node:crypto';
import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { phaseBracketNodes } from './schema.js';
import type {
    BracketNode,
    BracketSourceKind,
} from '../../domain/entities/bracket-node.entity.js';
import type {
    BracketRepository,
    BracketSlotUpdate,
} from '../../domain/repositories/bracket.repository.js';
import type {
    BracketNodeDraft,
    BracketSlot,
    BracketStage,
} from '../../domain/services/bracket-builder.js';

function mapNode(row: typeof phaseBracketNodes.$inferSelect): BracketNode {
    return {
        id: row.id,
        phaseId: row.phaseId,
        sourcePhaseId: row.sourcePhaseId,
        stage: row.stage as BracketStage,
        round: row.round,
        position: row.position,
        legs: row.legs === 2 ? 2 : 1,
        homeTeamId: row.homeTeamId,
        awayTeamId: row.awayTeamId,
        homeSeed: row.homeSeed,
        awaySeed: row.awaySeed,
        homeSourceNodeId: row.homeSourceNodeId,
        homeSourceKind: row.homeSourceKind as BracketSourceKind | null,
        awaySourceNodeId: row.awaySourceNodeId,
        awaySourceKind: row.awaySourceKind as BracketSourceKind | null,
        matchId: row.matchId,
        secondLegMatchId: row.secondLegMatchId,
        homePenalties: row.homePenalties,
        awayPenalties: row.awayPenalties,
        winnerTeamId: row.winnerTeamId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export class DrizzleBracketRepository implements BracketRepository {
    async findByPhaseId(phaseId: string): Promise<BracketNode[]> {
        const rows = await db
            .select()
            .from(phaseBracketNodes)
            .where(eq(phaseBracketNodes.phaseId, phaseId))
            .orderBy(
                asc(phaseBracketNodes.round),
                asc(phaseBracketNodes.stage),
                asc(phaseBracketNodes.position),
            );
        return rows.map(mapNode);
    }

    async findById(id: string): Promise<BracketNode | null> {
        const [row] = await db
            .select()
            .from(phaseBracketNodes)
            .where(eq(phaseBracketNodes.id, id))
            .limit(1);
        return row ? mapNode(row) : null;
    }

    async findByMatchId(matchId: string): Promise<BracketNode | null> {
        const [row] = await db
            .select()
            .from(phaseBracketNodes)
            .where(
                or(
                    eq(phaseBracketNodes.matchId, matchId),
                    eq(phaseBracketNodes.secondLegMatchId, matchId),
                ),
            )
            .limit(1);
        return row ? mapNode(row) : null;
    }

    async findDependents(nodeId: string): Promise<BracketNode[]> {
        const rows = await db
            .select()
            .from(phaseBracketNodes)
            .where(
                or(
                    eq(phaseBracketNodes.homeSourceNodeId, nodeId),
                    eq(phaseBracketNodes.awaySourceNodeId, nodeId),
                ),
            );
        return rows.map(mapNode);
    }

    async existsBySourcePhaseId(sourcePhaseId: string): Promise<boolean> {
        const [row] = await db
            .select({ id: phaseBracketNodes.id })
            .from(phaseBracketNodes)
            .where(eq(phaseBracketNodes.sourcePhaseId, sourcePhaseId))
            .limit(1);
        return row !== undefined;
    }

    async replaceAll(
        phaseId: string,
        sourcePhaseId: string,
        drafts: BracketNodeDraft[],
    ): Promise<BracketNode[]> {
        // Los ids se generan aquí para poder enlazar cada nodo con su origen en un solo INSERT.
        const idByKey = new Map(drafts.map((draft) => [draft.key, randomUUID()]));
        const idOf = (key: string): string => {
            const id = idByKey.get(key);
            if (!id) throw new Error(`Unknown bracket node key: ${key}`);
            return id;
        };

        const slotColumns = (slot: BracketSlot) =>
            slot.kind === 'team'
                ? { teamId: slot.teamId, seed: slot.seed, sourceNodeId: null, sourceKind: null }
                : { teamId: null, seed: null, sourceNodeId: idOf(slot.nodeKey), sourceKind: slot.kind };

        const rows = drafts.map((draft) => {
            const home = slotColumns(draft.home);
            const away = slotColumns(draft.away);
            return {
                id: idOf(draft.key),
                phaseId,
                sourcePhaseId,
                stage: draft.stage,
                round: draft.round,
                position: draft.position,
                legs: draft.legs,
                homeTeamId: home.teamId,
                homeSeed: home.seed,
                homeSourceNodeId: home.sourceNodeId,
                homeSourceKind: home.sourceKind,
                awayTeamId: away.teamId,
                awaySeed: away.seed,
                awaySourceNodeId: away.sourceNodeId,
                awaySourceKind: away.sourceKind,
            };
        });

        await db.transaction(async (tx) => {
            await tx.delete(phaseBracketNodes).where(eq(phaseBracketNodes.phaseId, phaseId));
            if (rows.length > 0) {
                // Un solo INSERT: Postgres valida las claves foráneas entre nodos al terminar la sentencia.
                await tx.insert(phaseBracketNodes).values(rows);
            }
        });

        return this.findByPhaseId(phaseId);
    }

    async deleteByPhaseId(phaseId: string): Promise<void> {
        await db.delete(phaseBracketNodes).where(eq(phaseBracketNodes.phaseId, phaseId));
    }

    async attachMatch(
        nodeId: string,
        leg: 1 | 2,
        matchId: string,
    ): Promise<BracketNode | null> {
        // La condición "IS NULL" hace atómico el cupo: si dos peticiones llegan a la vez,
        // solo una actualiza la fila.
        const slot = leg === 1 ? phaseBracketNodes.matchId : phaseBracketNodes.secondLegMatchId;
        const values =
            leg === 1
                ? { matchId, updatedAt: new Date() }
                : { secondLegMatchId: matchId, updatedAt: new Date() };

        const [row] = await db
            .update(phaseBracketNodes)
            .set(values)
            .where(and(eq(phaseBracketNodes.id, nodeId), isNull(slot)))
            .returning();
        return row ? mapNode(row) : null;
    }

    async applyResult(
        nodeId: string,
        winnerTeamId: string | null,
        slotUpdates: BracketSlotUpdate[],
        penalties?: { home: number | null; away: number | null },
    ): Promise<void> {
        await db.transaction(async (tx) => {
            await tx
                .update(phaseBracketNodes)
                .set({
                    winnerTeamId,
                    ...(penalties
                        ? { homePenalties: penalties.home, awayPenalties: penalties.away }
                        : {}),
                    updatedAt: new Date(),
                })
                .where(eq(phaseBracketNodes.id, nodeId));

            for (const update of slotUpdates) {
                const values =
                    update.side === 'home'
                        ? { homeTeamId: update.teamId, updatedAt: new Date() }
                        : { awayTeamId: update.teamId, updatedAt: new Date() };
                await tx
                    .update(phaseBracketNodes)
                    .set(values)
                    .where(eq(phaseBracketNodes.id, update.nodeId));
            }
        });
    }
}