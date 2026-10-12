import { and, eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matchEvents } from './schema.js';

import type {
    MatchEventRepository,
    NewMatchEventInput,
} from '../../domain/repositories/match-event.repository.js';
import type { MatchEvent, MatchEventType } from '../../domain/entities/match-event.entity.js';
import { MatchEventNotFoundError } from '../../domain/errors/match-event.errors.js';
import { MatchNotFoundError, MatchNotInProgressError } from '../../../matches/domain/errors/match.errors.js';
import { lockMatch, syncMatchScore } from '../../../matches/infrastructure/database/match-score-sync.js';


function toEvent(row: typeof matchEvents.$inferSelect): MatchEvent {
    return { ...row, eventType: row.eventType as MatchEventType };
}

export class DrizzleMatchEventRepository implements MatchEventRepository {
    async findById(id: string): Promise<MatchEvent | null> {
        const [row] = await db.select().from(matchEvents).where(eq(matchEvents.id, id)).limit(1);
        return row ? toEvent(row) : null;
    }

    async findByMatchId(matchId: string): Promise<MatchEvent[]> {
        const rows = await db.select().from(matchEvents).where(eq(matchEvents.matchId, matchId));
        return rows.map(toEvent);
    }

    async createAndSyncScore(
        input: NewMatchEventInput,
    ): Promise<{ event: MatchEvent; duplicated: boolean }> {
        return db.transaction(async (tx) => {
            const match = await lockMatch(tx, input.matchId);
            if (!match) throw new MatchNotFoundError();

            // Primero el duplicado: un reintento tardío (ya finalizado) no debe fallar.
            if (input.clientEventId) {
                const [existing] = await tx
                    .select()
                    .from(matchEvents)
                    .where(
                        and(
                            eq(matchEvents.matchId, input.matchId),
                            eq(matchEvents.clientEventId, input.clientEventId),
                        ),
                    )
                    .limit(1);
                if (existing) return { event: toEvent(existing), duplicated: true };
            }

            if (match.status !== 'in_progress') throw new MatchNotInProgressError();

            const [row] = await tx
                .insert(matchEvents)
                .values({
                    tournamentId: input.tournamentId,
                    categoryId: input.categoryId,
                    matchId: input.matchId,
                    eventType: input.eventType,
                    minute: input.minute ?? null,
                    teamId: input.teamId,
                    playerId: input.playerId ?? null,
                    assistedByPlayerId: input.assistedByPlayerId ?? null,
                    description: input.description ?? null,
                    clientEventId: input.clientEventId ?? null,
                    createdByUserId: input.createdByUserId,
                })
                .returning();
            if (!row) throw new Error('Failed to create match event');

            await syncMatchScore(tx, match, input.createdByUserId);
            return { event: toEvent(row), duplicated: false };
        });
    }

    async deleteAndSyncScore(eventId: string, userId: string): Promise<void> {
        await db.transaction(async (tx) => {
            const [event] = await tx
                .select({ matchId: matchEvents.matchId })
                .from(matchEvents)
                .where(eq(matchEvents.id, eventId))
                .limit(1);
            if (!event) throw new MatchEventNotFoundError();

            const match = await lockMatch(tx, event.matchId);
            if (!match) throw new MatchNotFoundError();
            if (match.status !== 'in_progress') throw new MatchNotInProgressError();

            await tx.delete(matchEvents).where(eq(matchEvents.id, eventId));
            await syncMatchScore(tx, match, userId);
        });
    }
}