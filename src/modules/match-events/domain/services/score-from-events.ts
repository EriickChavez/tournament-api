/** Eventos que cuentan como gol para el goleador (el autogol no). */
export function isScorerGoal(eventType: string): boolean {
    return eventType === 'gol' || eventType === 'gol_penal';
}

/**
 * Marcador a partir de los eventos. Fuente única de verdad.
 * Autogol: teamId es el equipo del jugador que lo comete; el gol suma al rival.
 */
export function computeScoreFromEvents(
    match: { homeTeamId: string; awayTeamId: string },
    events: { eventType: string; teamId: string }[],
): { homeScore: number; awayScore: number } {
    let homeScore = 0;
    let awayScore = 0;

    for (const event of events) {
        let scoringTeamId: string | null = null;
        if (isScorerGoal(event.eventType)) {
            scoringTeamId = event.teamId;
        } else if (event.eventType === 'autogol') {
            scoringTeamId = event.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
        }

        if (scoringTeamId === match.homeTeamId) homeScore += 1;
        else if (scoringTeamId === match.awayTeamId) awayScore += 1;
    }

    return { homeScore, awayScore };
}