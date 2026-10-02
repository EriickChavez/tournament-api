import type { MatchStatus } from '../entities/match.entity.js';
import { InvalidPenaltiesError } from '../errors/match-penalties.errors.js';

export interface MatchOutcomeInput {
    homeTeamId: string;
    awayTeamId: string;
    status: MatchStatus;
    homeScore: number | null;
    awayScore: number | null;
    homePenalties: number | null;
    awayPenalties: number | null;
}

/**
 * Ganador de un partido de eliminatoria. Devuelve null mientras no se pueda decidir:
 * el partido no ha terminado, falta el marcador, o hubo empate sin penales válidos.
 */
export function determineWinnerTeamId(match: MatchOutcomeInput): string | null {
    if (match.status !== 'finished') return null;
    if (match.homeScore === null || match.awayScore === null) return null;

    if (match.homeScore > match.awayScore) return match.homeTeamId;
    if (match.awayScore > match.homeScore) return match.awayTeamId;

    // Empate: lo deciden los penales (deben existir y no estar empatados).
    if (match.homePenalties === null || match.awayPenalties === null) return null;
    if (match.homePenalties === match.awayPenalties) return null;
    return match.homePenalties > match.awayPenalties ? match.homeTeamId : match.awayTeamId;
}

/**
 * Decide qué hacer con los penales al actualizar un partido. Devuelve el valor a guardar,
 * o undefined si no hay que tocarlos. Los penales solo existen si el marcador termina empatado.
 */
export function resolvePenalties(
    current: {
        homeScore: number | null;
        awayScore: number | null;
        homePenalties: number | null;
        awayPenalties: number | null;
    },
    input: {
        homeScore?: number | null | undefined;
        awayScore?: number | null | undefined;
        homePenalties?: number | null | undefined;
        awayPenalties?: number | null | undefined;
    },
): { homePenalties: number | null | undefined; awayPenalties: number | null | undefined } {
    const nextHome = input.homeScore !== undefined ? input.homeScore : current.homeScore;
    const nextAway = input.awayScore !== undefined ? input.awayScore : current.awayScore;
    const isDraw = nextHome !== null && nextAway !== null && nextHome === nextAway;

    const home = input.homePenalties;
    const away = input.awayPenalties;

    // No se enviaron penales.
    if (home === undefined && away === undefined) {
        const hadPenalties = current.homePenalties !== null || current.awayPenalties !== null;
        // Si el marcador ya no es empate, los penales guardados quedaron obsoletos: se limpian.
        if (hadPenalties && !isDraw) return { homePenalties: null, awayPenalties: null };
        return { homePenalties: undefined, awayPenalties: undefined };
    }

    if (home === undefined || away === undefined) {
        throw new InvalidPenaltiesError('homePenalties and awayPenalties must be sent together.');
    }

    // null en ambos: se borran.
    if (home === null || away === null) return { homePenalties: null, awayPenalties: null };

    if (!isDraw) throw new InvalidPenaltiesError('Penalties only apply when the match ends in a draw.');
    if (home === away) throw new InvalidPenaltiesError('A penalty shootout cannot end tied.');
    return { homePenalties: home, awayPenalties: away };
}