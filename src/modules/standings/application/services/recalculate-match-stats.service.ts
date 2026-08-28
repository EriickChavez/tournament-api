import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import type { MatchEventRepository } from '../../../match-events/domain/repositories/match-event.repository.js';
import type { TeamStandingRepository } from '../../domain/repositories/team-standing.repository.js';
import type { TopScorerRepository } from '../../domain/repositories/top-scorer.repository.js';
import type { CardCountRepository } from '../../domain/repositories/card-count.repository.js';

export class RecalculateMatchStatsService {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly matchEventRepository: MatchEventRepository,
        private readonly teamStandingRepository: TeamStandingRepository,
        private readonly topScorerRepository: TopScorerRepository,
        private readonly cardCountRepository: CardCountRepository,
    ) { }

    async recalculateForMatch(matchId: string): Promise<void> {
        const match = await this.matchRepository.findById(matchId);
        if (!match || match.status !== 'finished') {
            // Si el partido no está terminado, no cuenta para estadísticas.
            // (Si en algún momento estuvo finished y contó, y ahora deja de estarlo,
            // sería necesario "restar" — no cubierto aquí porque no hay caso de uso
            // hoy que revierta un status de finished a otro estado).
            return;
        }

        const events = await this.matchEventRepository.findByMatchId(matchId);

        const homeGoals = events.filter((e) => e.eventType === 'gol' && e.teamId === match.homeTeamId).length;
        const awayGoals = events.filter((e) => e.eventType === 'gol' && e.teamId === match.awayTeamId).length;

        await this.recalculateTeamStanding(match.tournamentId, match.categoryId, match.homeTeamId);
        await this.recalculateTeamStanding(match.tournamentId, match.categoryId, match.awayTeamId);
        void homeGoals;
        void awayGoals;

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

        const allPlayerIds = new Set([
            ...goalsByPlayer.keys(),
            ...assistsByPlayer.keys(),
            ...yellowsByPlayer.keys(),
            ...redsByPlayer.keys(),
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