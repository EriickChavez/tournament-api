import type { Match, MatchStatus } from '../entities/match.entity.js';

export interface MatchLifecycleRepository {
    /**
     * Cambia el estado de forma atómica (con el partido bloqueado). Si `to` es 'finished',
     * antes fija el marcador final desde los eventos (0-0 si no hay goles).
     * Lanza InvalidMatchTransitionError si el estado actual no está en `from`.
     */
    transition(input: {
        matchId: string;
        from: MatchStatus[];
        to: MatchStatus;
        userId: string;
    }): Promise<Match>;
}