import { env } from '../../../../config/env.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { MatchNotFoundError } from '../../domain/errors/match.errors.js';
import type { MatchStatsRecalculator } from './update-match.use-case.js';

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class DeleteMatchUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly matchStatsRecalculator: MatchStatsRecalculator,
    ) { }

    async execute(input: { matchId: string; userId: string }): Promise<void> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            match.tournamentId,
            input.userId,
        );
        if (!member || !isOwnerOrAdmin(member.roleId)) {
            throw new NotTournamentOwnerOrAdminError();
        }

        await this.matchRepository.delete(input.matchId);

        // Los eventos se borran en cascada, pero posiciones/goleadores/tarjetas son
        // tablas materializadas: sin recalcular, los puntos del partido borrado quedan.
        if (match.status === 'finished') {
            await this.matchStatsRecalculator.recalculateForTeams(match.tournamentId, match.categoryId, [
                match.homeTeamId,
                match.awayTeamId,
            ]);
        }
    }
}