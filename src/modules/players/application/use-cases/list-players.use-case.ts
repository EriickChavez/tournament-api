import type { Player } from '../../domain/entities/player.entity.js';
import type { PlayerRepository } from '../../domain/repositories/player.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';

export class ListPlayersUseCase {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly tournamentRepository: TournamentRepository,
    ) { }

    async execute(tournamentId: string): Promise<Player[]> {
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        return this.playerRepository.findByTournamentId(tournamentId);
    }
}