import { env } from '../../../../config/env.js';
import type { MatchEvent, MatchEventType } from '../../domain/entities/match-event.entity.js';
import type { MatchEventRepository } from '../../domain/repositories/match-event.repository.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { PlayerRepository } from '../../../players/domain/repositories/player.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { MatchNotFoundError } from '../../../matches/domain/errors/match.errors.js';
import {
    InvalidTeamForMatchEventError,
    InvalidPlayerForMatchEventError,
    InvalidAssistForMatchEventError,
} from '../../domain/errors/match-event.errors.js';

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class CreateMatchEventUseCase {
    constructor(
        private readonly matchEventRepository: MatchEventRepository,
        private readonly matchRepository: MatchRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly playerRepository: PlayerRepository,
    ) { }

    async execute(input: {
        matchId: string;
        userId: string;
        eventType: MatchEventType;
        minute?: number | undefined;
        teamId: string;
        playerId?: string | undefined;
        assistedByPlayerId?: string | undefined;
        description?: string | undefined;
    }): Promise<MatchEvent> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            match.tournamentId,
            input.userId,
        );
        if (!member || !isOwnerOrAdmin(member.roleId)) {
            throw new NotTournamentOwnerOrAdminError();
        }

        if (input.teamId !== match.homeTeamId && input.teamId !== match.awayTeamId) {
            throw new InvalidTeamForMatchEventError();
        }

        if (input.playerId) {
            const player = await this.playerRepository.findById(input.playerId);
            if (!player || player.teamId !== input.teamId) {
                throw new InvalidPlayerForMatchEventError();
            }
        }

        if (input.assistedByPlayerId) {
            if (input.eventType !== 'gol') {
                throw new InvalidAssistForMatchEventError();
            }
            const assistant = await this.playerRepository.findById(input.assistedByPlayerId);
            if (!assistant || assistant.teamId !== input.teamId) {
                throw new InvalidPlayerForMatchEventError();
            }
        }

        return this.matchEventRepository.create({
            tournamentId: match.tournamentId,
            categoryId: match.categoryId,
            matchId: input.matchId,
            eventType: input.eventType,
            minute: input.minute,
            teamId: input.teamId,
            playerId: input.playerId,
            assistedByPlayerId: input.assistedByPlayerId,
            description: input.description,
            createdByUserId: input.userId,
        });
    }
}
