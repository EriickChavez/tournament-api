import type { MatchEvent, MatchEventType } from '../entities/match-event.entity.js';

export interface MatchEventRepository {
    findById(id: string): Promise<MatchEvent | null>;
    findByMatchId(matchId: string): Promise<MatchEvent[]>;
    create(input: {
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
    }): Promise<MatchEvent>;
    delete(id: string): Promise<void>;
}
