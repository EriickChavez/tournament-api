import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { BrandingRepository } from '../../../branding/domain/repositories/branding.repository.js';
import type { TournamentBranding } from '../../../branding/domain/entities/branding.entity.js';
import { TournamentNotFoundError } from '../../domain/errors/tournaments.errors.js';

/**
 * Detalle público de un torneo por slug. Sin auth ni membership.
 * Incluye branding si existe.
 */
export class GetPublicTournamentUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly brandingRepository: BrandingRepository,
    ) { }

    async execute(slug: string): Promise<Tournament & { branding: TournamentBranding | null }> {
        const tournament = await this.tournamentRepository.findBySlug(slug);
        if (!tournament) throw new TournamentNotFoundError();

        const branding = await this.brandingRepository.findByTournamentId(tournament.id);

        return { ...tournament, branding };
    }
}