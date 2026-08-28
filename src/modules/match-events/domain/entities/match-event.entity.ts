export type MatchEventType = 'gol' | 'asistencia' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'cambio' | 'otro';

export interface MatchEvent {
    id: string;
    tournamentId: string;
    categoryId: string;
    matchId: string;
    eventType: MatchEventType;
    minute: number | null;
    teamId: string;
    playerId: string | null;
    assistedByPlayerId: string | null;
    description: string | null;
    createdByUserId: string | null;
    updatedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}