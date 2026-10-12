import type { MatchEvent, MatchEventType } from '../entities/match-event.entity.js';

export interface NewMatchEventInput {
    tournamentId: string;
    categoryId: string;
    matchId: string;
    eventType: MatchEventType;
    minute?: number | null | undefined;
    teamId: string;
    playerId?: string | null | undefined;
    assistedByPlayerId?: string | null | undefined;
    description?: string | null | undefined;
    clientEventId?: string | null | undefined;
    createdByUserId: string;
}

export interface MatchEventRepository {
    findById(id: string): Promise<MatchEvent | null>;
    findByMatchId(matchId: string): Promise<MatchEvent[]>;
    /**
     * Atómico: inserta el evento y recalcula el marcador (y limpia penales obsoletos).
     * Si el clientEventId ya existe en ese partido devuelve el evento original (duplicated=true).
     * Lanza MatchNotInProgressError si el partido no está en juego.
     */
    createAndSyncScore(
        input: NewMatchEventInput,
    ): Promise<{ event: MatchEvent; duplicated: boolean }>;
    /** Atómico: borra el evento y recalcula el marcador. Solo con el partido en juego. */
    deleteAndSyncScore(eventId: string, userId: string): Promise<void>;
}