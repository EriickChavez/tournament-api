import { env } from '../../../../config/env.js';
import type { MatchEventRepository } from '../../domain/repositories/match-event.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { MatchEventNotFoundError } from '../../domain/errors/match-event.errors.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class DeleteMatchEventUseCase {
    constructor(
        private readonly matchEventRepository: MatchEventRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
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

        // Borra y recalcula el marcador en una transacción (solo con el partido en juego).
        await this.matchEventRepository.deleteAndSyncScore(input.matchEventId, input.userId);
    }
}