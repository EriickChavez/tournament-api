import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';

/** Estado del partido tal como quedaría si se aplica el cambio. */
export interface MatchChangeSnapshot {
    homeTeamId: string;
    awayTeamId: string;
    status: MatchStatus;
    homeScore: number | null;
    awayScore: number | null;
    homePenalties: number | null;
    awayPenalties: number | null;
}

/**
 * Puerto hacia la llave de eliminatoria. Lo implementa el módulo de llaves; así matches no
 * depende de brackets (mismo patrón que MatchStatsRecalculator con standings).
 */
export interface MatchBracketSync {
    /**
     * Lanza si aplicar el cambio rompería la llave: por ejemplo, cambiaría el ganador de un
     * cruce del que ya depende un partido programado, o cambiaría los equipos del cruce.
     */
    assertCanApply(match: Match, next: MatchChangeSnapshot): Promise<void>;
    /** Propaga el resultado (ganador y perdedor) al siguiente cruce de la llave. */
    sync(matchId: string): Promise<void>;
    /** Antes de borrar un partido de la llave: valida y libera el cruce. */
    releaseForDeletion(matchId: string): Promise<void>;
}