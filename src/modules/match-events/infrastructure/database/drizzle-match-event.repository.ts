import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matchEvents } from './schema.js';
import {
    lockMatch,
    syncMatchScore,
} from '../../../matches/infrastructure/database/match-score-sync.js';
import type {
    MatchEventRepository,
    NewMatchEventInput,
    UpdateMatchEventInput,
} from '../../domain/repositories/match-event.repository.js';
import type { MatchEvent, MatchEventType } from '../../domain/entities/match-event.entity.js';
import { evaluateCardRule } from '../../domain/services/card-rules.js';
import {
    DerivedMatchEventError,
    MatchEventNotFoundError,
    PlayerAlreadySentOffError,
} from '../../domain/errors/match-event.errors.js';
import {
    MatchNotFoundError,
    MatchNotInProgressError,
} from '../../../matches/domain/errors/match.errors.js';

function toEvent(row: typeof matchEvents.$inferSelect): MatchEvent {
    return { ...row, eventType: row.eventType as MatchEventType };
}

const CARD_TYPES = ['tarjeta_amarilla', 'tarjeta_roja'];

export class DrizzleMatchEventRepository implements MatchEventRepository {
    async findById(id: string): Promise<MatchEvent | null> {
        const [row] = await db.select().from(matchEvents).where(eq(matchEvents.id, id)).limit(1);
        return row ? toEvent(row) : null;
    }

    async findByMatchId(matchId: string): Promise<MatchEvent[]> {
        const rows = await db
            .select()
            .from(matchEvents)
            .where(eq(matchEvents.matchId, matchId))
            .orderBy(
                sql`coalesce(${matchEvents.occurredAt}, ${matchEvents.createdAt})`,
                asc(matchEvents.createdAt),
            );
        return rows.map(toEvent);
    }

    async createAndSyncScore(input: NewMatchEventInput): Promise<{
        event: MatchEvent;
        duplicated: boolean;
        derivedEvents: MatchEvent[];
    }> {
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
                if (existing) {
                    const derived = await tx
                        .select()
                        .from(matchEvents)
                        .where(eq(matchEvents.derivedFromEventId, existing.id));
                    return {
                        event: toEvent(existing),
                        duplicated: true,
                        derivedEvents: derived.map(toEvent),
                    };
                }
            }

            if (match.status !== 'in_progress') throw new MatchNotInProgressError();

            // Reglas de tarjetas (con el partido bloqueado, no hay carreras entre dispositivos).
            let secondYellow = false;
            if (input.playerId && CARD_TYPES.includes(input.eventType)) {
                const cards = await tx
                    .select({ eventType: matchEvents.eventType })
                    .from(matchEvents)
                    .where(
                        and(
                            eq(matchEvents.matchId, input.matchId),
                            eq(matchEvents.playerId, input.playerId),
                            inArray(matchEvents.eventType, CARD_TYPES),
                        ),
                    );
                const decision = evaluateCardRule(
                    cards.map((c) => c.eventType),
                    input.eventType,
                );
                if (decision === 'sent_off') throw new PlayerAlreadySentOffError();
                secondYellow = decision === 'second_yellow';
            }

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
                    substitutePlayerId: input.substitutePlayerId ?? null,
                    description: input.description ?? null,
                    clientEventId: input.clientEventId ?? null,
                    occurredAt: input.occurredAt ?? null,
                    createdByUserId: input.createdByUserId,
                })
                .returning();
            if (!row) throw new Error('Failed to create match event');

            const derivedEvents: MatchEvent[] = [];
            if (secondYellow) {
                const [red] = await tx
                    .insert(matchEvents)
                    .values({
                        tournamentId: input.tournamentId,
                        categoryId: input.categoryId,
                        matchId: input.matchId,
                        eventType: 'tarjeta_roja',
                        minute: input.minute ?? null,
                        teamId: input.teamId,
                        playerId: input.playerId ?? null,
                        description: 'Doble amarilla',
                        occurredAt: input.occurredAt ?? null,
                        derivedFromEventId: row.id,
                        createdByUserId: input.createdByUserId,
                    })
                    .returning();
                if (red) derivedEvents.push(toEvent(red));
            }

            await syncMatchScore(tx, match, input.createdByUserId);
            return { event: toEvent(row), duplicated: false, derivedEvents };
        });
    }

    async updateInProgress(
        eventId: string,
        patch: UpdateMatchEventInput,
        userId: string,
    ): Promise<MatchEvent> {
        return db.transaction(async (tx) => {
            const [current] = await tx
                .select()
                .from(matchEvents)
                .where(eq(matchEvents.id, eventId))
                .limit(1);
            if (!current) throw new MatchEventNotFoundError();

            const match = await lockMatch(tx, current.matchId);
            if (!match) throw new MatchNotFoundError();
            if (match.status !== 'in_progress') throw new MatchNotInProgressError();
            if (current.derivedFromEventId) throw new DerivedMatchEventError();

            // Solo se tocan los campos enviados. Tipo y equipo no cambian: el marcador sigue igual.
            const changes: Partial<typeof matchEvents.$inferInsert> = {
                updatedByUserId: userId,
                updatedAt: new Date(),
            };
            if (patch.minute !== undefined) changes.minute = patch.minute;
            if (patch.playerId !== undefined) changes.playerId = patch.playerId;
            if (patch.assistedByPlayerId !== undefined) {
                changes.assistedByPlayerId = patch.assistedByPlayerId;
            }
            if (patch.substitutePlayerId !== undefined) {
                changes.substitutePlayerId = patch.substitutePlayerId;
            }
            if (patch.description !== undefined) changes.description = patch.description;
            if (patch.occurredAt !== undefined) changes.occurredAt = patch.occurredAt;

            const [row] = await tx
                .update(matchEvents)
                .set(changes)
                .where(eq(matchEvents.id, eventId))
                .returning();
            if (!row) throw new MatchEventNotFoundError();
            return toEvent(row);
        });
    }

    async deleteAndSyncScore(eventId: string, userId: string): Promise<void> {
        await db.transaction(async (tx) => {
            const [event] = await tx
                .select({
                    matchId: matchEvents.matchId,
                    derivedFromEventId: matchEvents.derivedFromEventId,
                })
                .from(matchEvents)
                .where(eq(matchEvents.id, eventId))
                .limit(1);
            // Idempotente: un reintento de borrado (p. ej. tras perder conexión) no falla.
            if (!event) return;

            const match = await lockMatch(tx, event.matchId);
            if (!match) throw new MatchNotFoundError();
            if (match.status !== 'in_progress') throw new MatchNotInProgressError();
            if (event.derivedFromEventId) throw new DerivedMatchEventError();

            // Si es una segunda amarilla, la roja derivada se borra en cascada (FK).
            await tx.delete(matchEvents).where(eq(matchEvents.id, eventId));
            await syncMatchScore(tx, match, userId);
        });
    }
}