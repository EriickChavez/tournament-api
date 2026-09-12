import type { TournamentSponsor } from '../../domain/entities/tournament-sponsor.entity.js';
import type { TournamentSponsorRepository } from '../../domain/repositories/tournament-sponsor.repository.js';

export class ListPublicTournamentSponsorsUseCase {
    constructor(private readonly sponsorRepository: TournamentSponsorRepository) { }

    async execute(tournamentId: string): Promise<TournamentSponsor[]> {
        return this.sponsorRepository.listPublicByTournament(tournamentId, new Date());
    }
}