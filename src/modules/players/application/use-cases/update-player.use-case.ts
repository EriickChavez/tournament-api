import { env } from '../../../../config/env.js';
import type { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';
import type { Player } from '../../domain/entities/player.entity.js';
import type { PlayerRepository } from '../../domain/repositories/player.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    PlayerNotFoundError,
    JerseyNumberAlreadyInUseError,
    InvalidCategoryForPlayerError,
    InvalidTeamForPlayerError,
} from '../../domain/errors/player.errors.js';

export class UpdatePlayerUseCase {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly teamRepository: TeamRepository,
        private readonly competitionGuard: CompetitionGuard,
    ) { }

    async execute(input: {
        playerId: string;
        userId: string;
        categoryId?: string | undefined;
        teamId?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        birthDate?: string | null | undefined;
        number?: number | undefined;
        isCaptain?: boolean | undefined;
        role?: string | null | undefined;
    }): Promise<Player> {
        const player = await this.playerRepository.findById(input.playerId);
        if (!player) throw new PlayerNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            player.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const nextCategoryId = input.categoryId ?? player.categoryId;
        const nextTeamId = input.teamId ?? player.teamId;

        // Corregir datos (nombre, dorsal, capitán...) se permite durante el torneo; con el campeonato cerrado no.
        await this.competitionGuard.assertRosterEditable(player.categoryId);

        // Pasar al jugador a otro equipo o categoría es un cambio de plantilla: solo antes de empezar.
        const movesPlayer = nextCategoryId !== player.categoryId || nextTeamId !== player.teamId;
        if (movesPlayer) {
            await this.competitionGuard.assertRosterOpen(player.categoryId);
            if (nextCategoryId !== player.categoryId) {
                await this.competitionGuard.assertRosterOpen(nextCategoryId);
            }
        }

        if (input.categoryId) {
            const category = await this.categoryRepository.findById(input.categoryId);
            if (!category || category.tournamentId !== player.tournamentId) {
                throw new InvalidCategoryForPlayerError();
            }
        }

        if (input.teamId || input.categoryId) {
            const team = await this.teamRepository.findById(nextTeamId);
            if (
                !team ||
                team.tournamentId !== player.tournamentId ||
                team.categoryId !== nextCategoryId
            ) {
                throw new InvalidTeamForPlayerError();
            }
        }

        const numberChanged = input.number !== undefined && input.number !== player.number;
        const teamChanged = input.teamId !== undefined && input.teamId !== player.teamId;
        const nextNumber = input.number !== undefined ? input.number : player.number;

        if ((numberChanged || teamChanged) && nextNumber !== null) {
            const existing = await this.playerRepository.findByTeamAndNumber(
                nextTeamId,
                nextNumber,
            );
            if (existing && existing.id !== player.id) {
                throw new JerseyNumberAlreadyInUseError(nextNumber);
            }
        }

        return this.playerRepository.update(input.playerId, {
            categoryId: input.categoryId,
            teamId: input.teamId,
            firstName: input.firstName,
            lastName: input.lastName,
            birthDate: input.birthDate,
            number: input.number,
            isCaptain: input.isCaptain,
            role: input.role,
            updatedByUserId: input.userId,
        });
    }
}