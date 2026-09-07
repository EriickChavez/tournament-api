import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import type { BrandingRepository } from '../../../branding/domain/repositories/branding.repository.js';
import type { TournamentBranding } from '../../../branding/domain/entities/branding.entity.js';
import {
    NotTournamentMemberError,
    TournamentNotFoundError,
} from '../../domain/errors/tournaments.errors.js';

/**
 * Detalle de un torneo para el admin.
 * Solo miembros del torneo pueden verlo (aislamiento multi-tenant).
 * Incluye branding si existe.
 */
export class GetTournamentUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly brandingRepository: BrandingRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
    }): Promise<Tournament & { roleId: string; branding: TournamentBranding | null }> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member) throw new NotTournamentMemberError();

        const branding = await this.brandingRepository.findByTournamentId(input.tournamentId);

        return { ...tournament, roleId: member.roleId, branding };
    }
}