import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matches } from './schema.js';
import { matchEvents } from '../../../match-events/infrastructure/database/schema.js';
import { computeScoreFromEvents } from '../../../match-events/domain/services/score-from-events.js';

export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type MatchRow = typeof matches.$inferSelect;

/** Bloquea la fila del partido hasta que termine la transacción: serializa escrituras concurrentes. */
export async function lockMatch(tx: DbTx, matchId: string): Promise<MatchRow | null> {
    const [row] = await tx.select().from(matches).where(eq(matches.id, matchId)).for('update');
    return row ?? null;
}

/**
 * Recalcula el marcador desde los eventos y lo guarda. Si el marcador deja de ser empate,
 * limpia los penales que quedaron obsoletos.
 */
export async function syncMatchScore(
    tx: DbTx,
    match: MatchRow,
    userId: string,
): Promise<{ homeScore: number; awayScore: number }> {
    const events = await tx
        .select({ eventType: matchEvents.eventType, teamId: matchEvents.teamId })
        .from(matchEvents)
        .where(eq(matchEvents.matchId, match.id));

    const { homeScore, awayScore } = computeScoreFromEvents(match, events);
    const hadPenalties = match.homePenalties !== null || match.awayPenalties !== null;
    const clearPenalties = hadPenalties && homeScore !== awayScore;

    await tx
        .update(matches)
        .set({
            homeScore,
            awayScore,
            ...(clearPenalties && { homePenalties: null, awayPenalties: null }),
            updatedByUserId: userId,
            updatedAt: new Date(),
        })
        .where(eq(matches.id, match.id));

    return { homeScore, awayScore };
}