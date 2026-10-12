import type { MatchEvent } from '../../domain/entities/match-event.entity.js';

export function toPublicMatchEvent(event: MatchEvent) {
    return {
        id: event.id,
        matchId: event.matchId,
        eventType: event.eventType,
        minute: event.minute,
        teamId: event.teamId,
        playerId: event.playerId,
        assistedByPlayerId: event.assistedByPlayerId,
        substitutePlayerId: event.substitutePlayerId,
        description: event.description,
        clientEventId: event.clientEventId,
        occurredAt: event.occurredAt ? event.occurredAt.toISOString() : null,
        derivedFromEventId: event.derivedFromEventId,
    };
}