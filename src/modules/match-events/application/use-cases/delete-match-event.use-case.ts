import { env } from '../../../../config/env.js';
import type { MatchEventRepository } from '../../domain/repositories/match-event.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { MatchEventNotFoundError } from '../../domain/errors/match-event.errors.js';
import type { MatchStatsRecalculator } from './create-match-event.use-case.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class DeleteMatchEventUseCase {
    constructor(
        private readonly matchEventRepository: MatchEventRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly matchStatsRecalculator: MatchStatsRecalculator,
        private readonly matchRepository: MatchRepository,
        private readonly competitionGuard: CompetitionGuard,
    ) { }

    async execute(input: { matchEventId: string; userId: string }): Promise<void> {
        const event = await this.matchEventRepository.findById(input.matchEventId);
        if (!event) throw new MatchEventNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            event.tournamentId,
            input.userId,
        );
        if (!member || !isOwnerOrAdmin(member.roleId)) {
            throw new NotTournamentOwnerOrAdminError();
        }
        const match = await this.matchRepository.findById(event.matchId);
        if (match) await this.competitionGuard.assertNotFinished(match.categoryId);

        const matchId = event.matchId;
        const wasGoal = event.eventType === 'gol';
        await this.matchEventRepository.delete(input.matchEventId);

        // Si se borró un gol, sincronizar marcador del partido.
        if (wasGoal && match) {
            const allEvents = await this.matchEventRepository.findByMatchId(matchId);
            const homeScore = allEvents.filter((e) => e.eventType === 'gol' && e.teamId === match.homeTeamId).length;
            const awayScore = allEvents.filter((e) => e.eventType === 'gol' && e.teamId === match.awayTeamId).length;
            await this.matchRepository.update(matchId, { homeScore, awayScore, updatedByUserId: input.userId });
        }

        await this.matchStatsRecalculator.recalculateForMatch(matchId);
    }
}