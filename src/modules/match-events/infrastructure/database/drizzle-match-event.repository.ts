import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matchEvents } from './schema.js';
import type { MatchEventRepository } from '../../domain/repositories/match-event.repository.js';
import type { MatchEvent, MatchEventType } from '../../domain/entities/match-event.entity.js';

export class DrizzleMatchEventRepository implements MatchEventRepository {
    async findById(id: string): Promise<MatchEvent | null> {
        const [row] = await db.select().from(matchEvents).where(eq(matchEvents.id, id)).limit(1);
        return row ? { ...row, eventType: row.eventType as MatchEventType } : null;
    }

    async findByMatchId(matchId: string): Promise<MatchEvent[]> {
        const rows = await db.select().from(matchEvents).where(eq(matchEvents.matchId, matchId));
        return rows.map((row) => ({ ...row, eventType: row.eventType as MatchEventType }));
    }

    async create(input: {
        tournamentId: string;
        categoryId: string;
        matchId: string;
        eventType: MatchEventType;
        minute?: number | null | undefined;
        teamId: string;
        playerId?: string | null | undefined;
        assistedByPlayerId?: string | null | undefined;
        description?: string | null | undefined;
        createdByUserId: string;
    }): Promise<MatchEvent> {
        const [row] = await db
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
                createdByUserId: input.createdByUserId,
            })
            .returning();
        if (!row) throw new Error('Failed to create match event');
        return { ...row, eventType: row.eventType as MatchEventType };
    }

    async delete(id: string): Promise<void> {
        const [row] = await db.delete(matchEvents).where(eq(matchEvents.id, id)).returning();
        if (!row) throw new Error('Failed to delete match event');
    }
}
