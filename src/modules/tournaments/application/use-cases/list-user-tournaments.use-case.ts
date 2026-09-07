import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { BrandingRepository } from '../../../branding/domain/repositories/branding.repository.js';
import type { TournamentBranding } from '../../../branding/domain/entities/branding.entity.js';

export class ListUserTournamentsUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly brandingRepository: BrandingRepository,
    ) { }

    async execute(
        userId: string,
    ): Promise<Array<Tournament & { roleId: string; branding: TournamentBranding | null }>> {
        const tournaments = await this.tournamentRepository.findAllForUser(userId);
        if (tournaments.length === 0) return [];

        const brandings = await this.brandingRepository.findByTournamentIds(
            tournaments.map((t) => t.id),
        );
        const brandingByTournamentId = new Map(
            brandings.map((b) => [b.tournamentId, b]),
        );

        return tournaments.map((tournament) => ({
            ...tournament,
            branding: brandingByTournamentId.get(tournament.id) ?? null,
        }));
    }
}