import { env } from '../../../../config/env.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { MatchRefereeRepository } from '../../domain/repositories/match-referee.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import {
    NotTournamentMemberError,
    NotTournamentOwnerError,
} from '../../../tournaments/domain/errors/tournaments.errors.js';
import { MatchNotFoundError, InvalidRefereeError } from '../../domain/errors/match.errors.js';
import { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class MatchRefereesUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly matchRefereeRepository: MatchRefereeRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly competitionGuard: CompetitionGuard,
    ) { }

    /** Cualquier miembro del torneo puede ver quién está asignado. */
    async list(input: { matchId: string; userId: string }): Promise<string[]> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            match.tournamentId,
            input.userId,
        );
        if (!member) throw new NotTournamentMemberError();

        return this.matchRefereeRepository.findUserIdsByMatchId(match.id);
    }

    /** Solo el owner asigna. Reemplaza el conjunto completo; [] deja el partido sin asignar. */
    async set(input: {
        matchId: string;
        userId: string;
        refereeUserIds: string[];
    }): Promise<string[]> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            match.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }
        await this.competitionGuard.assertNotFinished(match.categoryId);

        const uniqueIds = [...new Set(input.refereeUserIds)];
        const members = await Promise.all(
            uniqueIds.map((id) =>
                this.tournamentMemberRepository.findByTournamentAndUser(match.tournamentId, id),
            ),
        );
        if (members.some((m) => !m || !isOwnerOrAdmin(m.roleId))) {
            throw new InvalidRefereeError();
        }

        await this.matchRefereeRepository.replaceForMatch(match.id, uniqueIds, input.userId);
        return uniqueIds;
    }
}