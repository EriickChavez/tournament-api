import { env } from '../../../../config/env.js';
import type { MatchEvent } from '../../domain/entities/match-event.entity.js';
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
    DerivedMatchEventError,
    InvalidAssistForMatchEventError,
    InvalidMatchEventUpdateError,
    InvalidOccurredAtError,
    InvalidPlayerForMatchEventError,
    InvalidSubstitutionError,
    MatchEventNotFoundError,
} from '../../domain/errors/match-event.errors.js';
import { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';

// Tolerancia por relojes de dispositivos ligeramente adelantados.
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class UpdateMatchEventUseCase {
    constructor(
        private readonly matchEventRepository: MatchEventRepository,
        private readonly matchRepository: MatchRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly playerRepository: PlayerRepository,
        private readonly competitionGuard: CompetitionGuard,
        private readonly matchRefereeRepository: MatchRefereeRepository,
    ) { }

    async execute(input: {
        matchEventId: string;
        userId: string;
        minute?: number | null | undefined;
        playerId?: string | null | undefined;
        assistedByPlayerId?: string | null | undefined;
        substitutePlayerId?: string | null | undefined;
        description?: string | null | undefined;
        occurredAt?: Date | null | undefined;
    }): Promise<MatchEvent> {
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
        if (!match) throw new MatchNotFoundError();

        // Con árbitros asignados, solo ellos (y el owner) editan eventos.
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

        if (event.derivedFromEventId) throw new DerivedMatchEventError();

        if (input.occurredAt && input.occurredAt.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
            throw new InvalidOccurredAtError();
        }

        // En una tarjeta el jugador no se cambia: la regla de doble amarilla depende de él.
        const isCard = event.eventType === 'tarjeta_amarilla' || event.eventType === 'tarjeta_roja';
        if (isCard && input.playerId !== undefined && input.playerId !== event.playerId) {
            throw new InvalidMatchEventUpdateError(
                'The player of a card cannot be changed. Delete the card and register it again.',
            );
        }

        // Cambio: sale (playerId) y entra (substitutePlayerId) deben seguir siendo válidos y distintos.
        if (event.eventType === 'cambio') {
            const nextPlayerId = input.playerId !== undefined ? input.playerId : event.playerId;
            const nextSubstituteId =
                input.substitutePlayerId !== undefined
                    ? input.substitutePlayerId
                    : event.substitutePlayerId;
            if (!nextPlayerId || !nextSubstituteId || nextPlayerId === nextSubstituteId) {
                throw new InvalidSubstitutionError();
            }
        } else if (input.substitutePlayerId) {
            throw new InvalidSubstitutionError();
        }

        if (input.assistedByPlayerId && event.eventType !== 'gol') {
            throw new InvalidAssistForMatchEventError();
        }

        // Todo jugador nuevo debe pertenecer al equipo del evento.
        const newPlayerIds = [
            input.playerId,
            input.assistedByPlayerId,
            input.substitutePlayerId,
        ].filter((id): id is string => typeof id === 'string');
        for (const playerId of newPlayerIds) {
            const player = await this.playerRepository.findById(playerId);
            if (!player || player.teamId !== event.teamId) {
                throw new InvalidPlayerForMatchEventError();
            }
        }

        return this.matchEventRepository.updateInProgress(
            event.id,
            {
                minute: input.minute,
                playerId: input.playerId,
                assistedByPlayerId: input.assistedByPlayerId,
                substitutePlayerId: input.substitutePlayerId,
                description: input.description,
                occurredAt: input.occurredAt,
            },
            input.userId,
        );
    }
}