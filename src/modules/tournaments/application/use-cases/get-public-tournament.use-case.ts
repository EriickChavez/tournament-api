import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import { TournamentNotFoundError } from '../../domain/errors/tournaments.errors.js';

/**
 * Detalle público de un torneo por slug. Sin auth ni membership.
 */
export class GetPublicTournamentUseCase {
    constructor(private readonly tournamentRepository: TournamentRepository) { }

    async execute(slug: string): Promise<Tournament> {
        const tournament = await this.tournamentRepository.findBySlug(slug);
        if (!tournament) throw new TournamentNotFoundError();
        return tournament;
    }
}