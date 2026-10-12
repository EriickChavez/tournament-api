import { env } from '../../../../config/env.js';
import type { MatchEvent, MatchEventType } from '../../domain/entities/match-event.entity.js';
import type { MatchEventRepository } from '../../domain/repositories/match-event.repository.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import type { MatchRefereeRepository } from '../../../matches/domain/repositories/match-referee.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { PlayerRepository } from '../../../players/domain/repositories/player.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    MatchNotFoundError,
    NotAssignedToMatchError,
} from '../../../matches/domain/errors/match.errors.js';
import { canOperateMatch } from '../../../matches/domain/services/match-referee-access.js';
import {
    InvalidTeamForMatchEventError,
    InvalidPlayerForMatchEventError,
    InvalidAssistForMatchEventError,
    InvalidSubstitutionError,
    InvalidOccurredAtError,
} from '../../domain/errors/match-event.errors.js';
import { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';

// Tolerancia por relojes de dispositivos ligeramente adelantados.
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class CreateMatchEventUseCase {
    constructor(
        private readonly matchEventRepository: MatchEventRepository,
        private readonly matchRepository: MatchRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly playerRepository: PlayerRepository,
        private readonly competitionGuard: CompetitionGuard,
        private readonly matchRefereeRepository: MatchRefereeRepository,
    ) { }

    async execute(input: {
        matchId: string;
        userId: string;
        eventType: MatchEventType;
        minute?: number | undefined;
        teamId: string;
        playerId?: string | undefined;
        assistedByPlayerId?: string | undefined;
        substitutePlayerId?: string | undefined;
        description?: string | undefined;
        clientEventId?: string | undefined;
        occurredAt?: Date | undefined;
    }): Promise<{ event: MatchEvent; duplicated: boolean; derivedEvents: MatchEvent[] }> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            match.tournamentId,
            input.userId,
        );
        if (!member || !isOwnerOrAdmin(member.roleId)) {
            throw new NotTournamentOwnerOrAdminError();
        }

        // Con árbitros asignados, solo ellos (y el owner) registran eventos.
        const assignedUserIds = await this.matchRefereeRepository.findUserIdsByMatchId(match.id);
        if (
            !canOperateMatch({
                isOwner: member.roleId === env.OWNER_ROLE_ID,
                assignedUserIds,
                userId: input.userId,
            })
        ) {
            throw new NotAssignedToMatchError();
        }

        await this.competitionGuard.assertNotFinished(match.categoryId);

        if (input.occurredAt && input.occurredAt.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
            throw new InvalidOccurredAtError();
        }

        if (input.teamId !== match.homeTeamId && input.teamId !== match.awayTeamId) {
            throw new InvalidTeamForMatchEventError();
        }

        // Cambio: sale (playerId) y entra (substitutePlayerId), distintos y del mismo equipo.
        if (input.eventType === 'cambio') {
            if (
                !input.playerId ||
                !input.substitutePlayerId ||
                input.playerId === input.substitutePlayerId
            ) {
                throw new InvalidSubstitutionError();
            }
        } else if (input.substitutePlayerId) {
            throw new InvalidSubstitutionError();
        }

        if (input.playerId) {
            const player = await this.playerRepository.findById(input.playerId);
            if (!player || player.teamId !== input.teamId) {
                throw new InvalidPlayerForMatchEventError();
            }
        }

        if (input.substitutePlayerId) {
            const substitute = await this.playerRepository.findById(input.substitutePlayerId);
            if (!substitute || substitute.teamId !== input.teamId) {
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

        // Tarjetas + evento + marcador en una sola transacción. Stats y llave se recalculan al finalizar.
        return this.matchEventRepository.createAndSyncScore({
            tournamentId: match.tournamentId,
            categoryId: match.categoryId,
            matchId: input.matchId,
            eventType: input.eventType,
            minute: input.minute,
            teamId: input.teamId,
            playerId: input.playerId,
            assistedByPlayerId: input.assistedByPlayerId,
            substitutePlayerId: input.substitutePlayerId,
            description: input.description,
            clientEventId: input.clientEventId,
            occurredAt: input.occurredAt,
            createdByUserId: input.userId,
        });
    }
}