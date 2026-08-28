import { env } from '../../../../config/env.js';
import type { PlayerRepository } from '../../domain/repositories/player.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { PlayerNotFoundError } from '../../domain/errors/player.errors.js';

export class DeletePlayerUseCase {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: { playerId: string; userId: string }): Promise<void> {
        const player = await this.playerRepository.findById(input.playerId);
        if (!player) throw new PlayerNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            player.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        await this.playerRepository.delete(input.playerId);
    }
}