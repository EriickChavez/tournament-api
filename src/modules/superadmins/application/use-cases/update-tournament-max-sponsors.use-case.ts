import type { Tournament } from '../../../tournaments/domain/entities/tournaments.entity.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';

export class UpdateTournamentMaxSponsorsUseCase {
    constructor(private readonly tournamentRepository: TournamentRepository) { }

    async execute(input: {
        tournamentId: string;
        maxSponsors: number;
    }): Promise<Tournament> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) {
            throw new TournamentNotFoundError();
        }

        return this.tournamentRepository.updateMaxSponsors(
            input.tournamentId,
            input.maxSponsors,
        );
    }
}