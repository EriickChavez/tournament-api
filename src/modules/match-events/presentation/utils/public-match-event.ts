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
        description: event.description,
    };
}