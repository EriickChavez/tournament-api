export type MatchEventType =
    | 'gol'
    | 'gol_penal'
    | 'autogol'
    | 'asistencia'
    | 'tarjeta_amarilla'
    | 'tarjeta_roja'
    | 'cambio'
    | 'otro';

export interface MatchEvent {
    id: string;
    tournamentId: string;
    categoryId: string;
    matchId: string;
    eventType: MatchEventType;
    minute: number | null;
    teamId: string;
    /** En un 'cambio' es el jugador que sale. */
    playerId: string | null;
    assistedByPlayerId: string | null;
    /** Solo en 'cambio': el jugador que entra. */
    substitutePlayerId: string | null;
    description: string | null;
    clientEventId: string | null;
    /** Hora real del evento según el dispositivo (cola offline). */
    occurredAt: Date | null;
    /** Si no es null, el evento lo generó el sistema a partir de otro (p. ej. roja por doble amarilla). */
    derivedFromEventId: string | null;
    createdByUserId: string | null;
    updatedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}