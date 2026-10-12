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
    substitutePlayerId?: string | null | undefined;
    description?: string | null | undefined;
    clientEventId?: string | null | undefined;
    occurredAt?: Date | null | undefined;
    createdByUserId: string;
}

/** Campos editables de un evento. undefined = no tocar; null = limpiar. */
export interface UpdateMatchEventInput {
    minute?: number | null | undefined;
    playerId?: string | null | undefined;
    assistedByPlayerId?: string | null | undefined;
    substitutePlayerId?: string | null | undefined;
    description?: string | null | undefined;
    occurredAt?: Date | null | undefined;
}

export interface MatchEventRepository {
    findById(id: string): Promise<MatchEvent | null>;
    /** Ordenados por hora real (occurredAt, o creación si no viene). */
    findByMatchId(matchId: string): Promise<MatchEvent[]>;
    /**
     * Atómico: aplica las reglas de tarjetas, inserta el evento (más la roja si es doble amarilla)
     * y recalcula el marcador (limpiando penales obsoletos).
     * Si el clientEventId ya existe en ese partido devuelve el evento original (duplicated=true).
     * Lanza MatchNotInProgressError si el partido no está en juego.
     */
    createAndSyncScore(input: NewMatchEventInput): Promise<{
        event: MatchEvent;
        duplicated: boolean;
        derivedEvents: MatchEvent[];
    }>;
    /**
     * Atómico: actualiza campos no estructurales del evento con el partido bloqueado.
     * Tipo y equipo no se pueden cambiar, así que el marcador no se recalcula.
     * Lanza MatchNotInProgressError si el partido no está en juego, y
     * DerivedMatchEventError si el evento lo generó el sistema.
     */
    updateInProgress(eventId: string, patch: UpdateMatchEventInput, userId: string): Promise<MatchEvent>;
    /**
     * Atómico: borra el evento y recalcula el marcador. Solo con el partido en juego.
     * Idempotente: si el evento ya no existe, no hace nada.
     * Lanza DerivedMatchEventError si el evento lo generó el sistema.
     */
    deleteAndSyncScore(eventId: string, userId: string): Promise<void>;
}