import type { MatchStatus } from '../../../matches/domain/entities/match.entity.js';
import { determineWinnerTeamId } from '../../../matches/domain/services/match-outcome.js';

/** Estado de uno de los partidos de un cruce. */
export interface LegResult {
    homeTeamId: string;
    awayTeamId: string;
    status: MatchStatus;
    homeScore: number | null;
    awayScore: number | null;
    homePenalties: number | null;
    awayPenalties: number | null;
}

export interface TieTeams {
    homeTeamId: string;
    awayTeamId: string;
}

export interface TieInput extends TieTeams {
    legs: 1 | 2;
    /** Penales del cruce a dos partidos (respecto a homeTeamId / awayTeamId). */
    penalties: { home: number | null; away: number | null };
}

/**
 * Goles acumulados de cada equipo del cruce, sumando todos los partidos. Devuelve null si
 * algún partido no ha terminado o no tiene marcador. En la vuelta el local es el visitante
 * del cruce, por eso se suma por equipo y no por posición.
 */
export function aggregateOf(
    tie: TieTeams,
    legs: LegResult[],
): { home: number; away: number } | null {
    let home = 0;
    let away = 0;
    for (const leg of legs) {
        if (leg.status !== 'finished' || leg.homeScore === null || leg.awayScore === null) {
            return null;
        }
        const tieHomeIsLegHome = leg.homeTeamId === tie.homeTeamId;
        home += tieHomeIsLegHome ? leg.homeScore : leg.awayScore;
        away += tieHomeIsLegHome ? leg.awayScore : leg.homeScore;
    }
    return { home, away };
}

/** true si es un cruce a dos partidos, ya terminaron los dos y el global quedó empatado. */
export function needsPenalties(tie: TieTeams & { legs: 1 | 2 }, legs: LegResult[]): boolean {
    if (tie.legs !== 2 || legs.length !== 2) return false;
    const aggregate = aggregateOf(tie, legs);
    return aggregate !== null && aggregate.home === aggregate.away;
}

/**
 * Ganador de un cruce. Partido único: marcador y, si hay empate, penales del partido.
 * Ida y vuelta: gana el global; si empata, los penales del cruce. Sin gol de visitante.
 * Devuelve null mientras no se pueda decidir.
 */
export function determineTieWinner(tie: TieInput, legs: LegResult[]): string | null {
    if (tie.legs === 1) {
        const leg = legs[0];
        return leg ? determineWinnerTeamId(leg) : null;
    }

    if (legs.length !== 2) return null;
    const aggregate = aggregateOf(tie, legs);
    if (!aggregate) return null;

    if (aggregate.home > aggregate.away) return tie.homeTeamId;
    if (aggregate.away > aggregate.home) return tie.awayTeamId;

    const { home, away } = tie.penalties;
    if (home === null || away === null || home === away) return null;
    return home > away ? tie.homeTeamId : tie.awayTeamId;
}