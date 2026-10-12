import { env } from '../../../../config/env.js';
import type { Match } from '../../domain/entities/match.entity.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { MatchLifecycleRepository } from '../../domain/repositories/match-lifecycle.repository.js';
import type { MatchEventRepository } from '../../../match-events/domain/repositories/match-event.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { computeScoreFromEvents } from '../../../match-events/domain/services/score-from-events.js';
import { MatchNotFoundError, InvalidMatchTransitionError } from '../../domain/errors/match.errors.js';
import type { MatchBracketSync } from '../ports/match-bracket-sync.port.js';
import type { MatchStatsRecalculator } from './update-match.use-case.js';
import { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

interface LifecycleInput {
    matchId: string;
    userId: string;
}

export class MatchLifecycleUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly matchLifecycleRepository: MatchLifecycleRepository,
        private readonly matchEventRepository: MatchEventRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly matchStatsRecalculator: MatchStatsRecalculator,
        private readonly competitionGuard: CompetitionGuard,
        private readonly matchBracketSync?: MatchBracketSync,
    ) { }

    /** scheduled | postponed → in_progress. Abre la cédula. */
    async start(input: LifecycleInput): Promise<Match> {
        const match = await this.authorize(input);
        return this.matchLifecycleRepository.transition({
            matchId: match.id,
            from: ['scheduled', 'postponed'],
            to: 'in_progress',
            userId: input.userId,
        });
    }

    /** in_progress → finished. Cierra la cédula, fija el marcador y propaga a tablas y llave. */
    async finish(input: LifecycleInput): Promise<Match> {
        const match = await this.authorize(input);
        if (match.status !== 'in_progress') {
            throw new InvalidMatchTransitionError(match.status, 'finished');
        }

        // Marcador tal como quedará, para validar contra la llave antes de escribir.
        const events = await this.matchEventRepository.findByMatchId(match.id);
        const { homeScore, awayScore } = computeScoreFromEvents(match, events);
        const isDraw = homeScore === awayScore;
        await this.matchBracketSync?.assertCanApply(match, {
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            status: 'finished',
            homeScore,
            awayScore,
            homePenalties: isDraw ? match.homePenalties : null,
            awayPenalties: isDraw ? match.awayPenalties : null,
        });

        const updated = await this.matchLifecycleRepository.transition({
            matchId: match.id,
            from: ['in_progress'],
            to: 'finished',
            userId: input.userId,
        });

        await this.matchStatsRecalculator.recalculateForMatch(match.id);
        await this.matchBracketSync?.sync(match.id);
        return updated;
    }

    /** finished → in_progress. Reabre la cédula para corregir; deshace stats y avance de llave. */
    async reopen(input: LifecycleInput): Promise<Match> {
        const match = await this.authorize(input);
        if (match.status !== 'finished') {
            throw new InvalidMatchTransitionError(match.status, 'in_progress');
        }

        await this.matchBracketSync?.assertCanApply(match, {
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            status: 'in_progress',
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            homePenalties: match.homePenalties,
            awayPenalties: match.awayPenalties,
        });

        const updated = await this.matchLifecycleRepository.transition({
            matchId: match.id,
            from: ['finished'],
            to: 'in_progress',
            userId: input.userId,
        });

        await this.matchStatsRecalculator.recalculateForMatch(match.id);
        await this.matchBracketSync?.sync(match.id);
        return updated;
    }

    private async authorize(input: LifecycleInput): Promise<Match> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            match.tournamentId,
            input.userId,
        );
        // Cuando "admin" pase a "referee", aquí se separa quién puede reabrir.
        if (!member || !isOwnerOrAdmin(member.roleId)) {
            throw new NotTournamentOwnerOrAdminError();
        }
        await this.competitionGuard.assertNotFinished(match.categoryId);
        return match;
    }
}