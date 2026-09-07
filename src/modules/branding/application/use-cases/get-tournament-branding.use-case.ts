import type { TournamentBranding } from '../../domain/entities/branding.entity.js';
import type { BrandingRepository } from '../../domain/repositories/branding.repository.js';

export class GetTournamentBrandingUseCase {
    constructor(private readonly brandingRepository: BrandingRepository) { }

    async execute(tournamentId: string): Promise<TournamentBranding | null> {
        return this.brandingRepository.findByTournamentId(tournamentId);
    }
}