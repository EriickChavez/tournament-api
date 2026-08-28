import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import type { MatchEventRepository } from '../../../match-events/domain/repositories/match-event.repository.js';
import type { TeamStandingRepository } from '../../domain/repositories/team-standing.repository.js';
import type { TopScorerRepository } from '../../domain/repositories/top-scorer.repository.js';
import type { CardCountRepository } from '../../domain/repositories/card-count.repository.js';

/**
 * Recalcula materializaciones (posiciones, goleadores, tarjetas) a partir de
 * partidos finished + eventos. Fuente de verdad = eventos_partido / partidos.
 */
export class RecalculateMatchStatsService {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly matchEventRepository: MatchEventRepository,
        private readonly teamStandingRepository: TeamStandingRepository,
        private readonly topScorerRepository: TopScorerRepository,
        private readonly cardCountRepository: CardCountRepository,
    ) { }

    /**
     * Recalcula standings de ambos equipos del partido y rankings de la categoría.
     * Se puede llamar aunque el partido no esté finished: los métodos internos
     * solo cuentan partidos finished, así que un-finish también corrige números.
     */
    async recalculateForMatch(matchId: string): Promise<void> {
        const match = await this.matchRepository.findById(matchId);
        if (!match) return;

        await this.recalculateTeamStanding(match.tournamentId, match.categoryId, match.homeTeamId);
        await this.recalculateTeamStanding(match.tournamentId, match.categoryId, match.awayTeamId);
        await this.recalculateTopScorersAndCards(match.tournamentId, match.categoryId);
    }

    private async recalculateTeamStanding(
        tournamentId: string,
        categoryId: string,
        teamId: string,
    ): Promise<void> {
        const finishedMatches = await this.matchRepository.findFinishedByTournamentCategoryAndTeam(
            tournamentId,
            categoryId,
            teamId,
        );

        let played = 0;
        let won = 0;
        let drawn = 0;
        let lost = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;

        for (const match of finishedMatches) {
            const events = await this.matchEventRepository.findByMatchId(match.id);
            const homeGoals = events.filter((e) => e.eventType === 'gol' && e.teamId === match.homeTeamId).length;
            const awayGoals = events.filter((e) => e.eventType === 'gol' && e.teamId === match.awayTeamId).length;

            const isHome = match.homeTeamId === teamId;
            const teamGoals = isHome ? homeGoals : awayGoals;
            const opponentGoals = isHome ? awayGoals : homeGoals;

            played += 1;
            goalsFor += teamGoals;
            goalsAgainst += opponentGoals;

            if (teamGoals > opponentGoals) won += 1;
            else if (teamGoals === opponentGoals) drawn += 1;
            else lost += 1;
        }

        const points = won * 3 + drawn;

        await this.teamStandingRepository.upsert({
            tournamentId,
            categoryId,
            teamId,
            played,
            won,
            drawn,
            lost,
            goalsFor,
            goalsAgainst,
            points,
        });
    }

    private async recalculateTopScorersAndCards(tournamentId: string, categoryId: string): Promise<void> {
        const finishedMatches = await this.matchRepository.findFinishedByTournamentAndCategory(
            tournamentId,
            categoryId,
        );

        const goalsByPlayer = new Map<string, number>();
        const assistsByPlayer = new Map<string, number>();
        const yellowsByPlayer = new Map<string, number>();
        const redsByPlayer = new Map<string, number>();

        for (const match of finishedMatches) {
            const events = await this.matchEventRepository.findByMatchId(match.id);
            for (const event of events) {
                if (event.eventType === 'gol' && event.playerId) {
                    goalsByPlayer.set(event.playerId, (goalsByPlayer.get(event.playerId) ?? 0) + 1);
                }
                if (event.eventType === 'gol' && event.assistedByPlayerId) {
                    assistsByPlayer.set(
                        event.assistedByPlayerId,
                        (assistsByPlayer.get(event.assistedByPlayerId) ?? 0) + 1,
                    );
                }
                if (event.eventType === 'tarjeta_amarilla' && event.playerId) {
                    yellowsByPlayer.set(event.playerId, (yellowsByPlayer.get(event.playerId) ?? 0) + 1);
                }
                if (event.eventType === 'tarjeta_roja' && event.playerId) {
                    redsByPlayer.set(event.playerId, (redsByPlayer.get(event.playerId) ?? 0) + 1);
                }
            }
        }

        // Incluir jugadores que ya tenían fila materializada para poder ponerlos en 0
        // si se borraron todos sus eventos.
        const [existingScorers, existingCards] = await Promise.all([
            this.topScorerRepository.findByTournamentAndCategory(tournamentId, categoryId),
            this.cardCountRepository.findByTournamentAndCategory(tournamentId, categoryId),
        ]);

        const allPlayerIds = new Set<string>([
            ...goalsByPlayer.keys(),
            ...assistsByPlayer.keys(),
            ...yellowsByPlayer.keys(),
            ...redsByPlayer.keys(),
            ...existingScorers.map((s) => s.playerId),
            ...existingCards.map((c) => c.playerId),
        ]);

        for (const playerId of allPlayerIds) {
            await this.topScorerRepository.upsert({
                tournamentId,
                categoryId,
                playerId,
                goals: goalsByPlayer.get(playerId) ?? 0,
                assists: assistsByPlayer.get(playerId) ?? 0,
            });

            await this.cardCountRepository.upsert({
                tournamentId,
                categoryId,
                playerId,
                yellowCards: yellowsByPlayer.get(playerId) ?? 0,
                redCards: redsByPlayer.get(playerId) ?? 0,
            });
        }
    }
}