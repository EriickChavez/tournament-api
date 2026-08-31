import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import {
    NotTournamentMemberError,
    TournamentNotFoundError,
} from '../../domain/errors/tournaments.errors.js';

/**
 * Detalle de un torneo para el admin.
 * Solo miembros del torneo pueden verlo (aislamiento multi-tenant).
 */
export class GetTournamentUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
    }): Promise<Tournament & { roleId: string }> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member) throw new NotTournamentMemberError();

        return { ...tournament, roleId: member.roleId };
    }
}