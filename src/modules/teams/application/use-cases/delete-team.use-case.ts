import { env } from '../../../../config/env.js';
import type { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';
import type { TeamRepository } from '../../domain/repositories/team.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { TeamNotFoundError } from '../../domain/errors/team.errors.js';

export class DeleteTeamUseCase {
    constructor(
        private readonly teamRepository: TeamRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly competitionGuard: CompetitionGuard,
    ) { }

    async execute(input: { teamId: string; userId: string }): Promise<void> {
        const team = await this.teamRepository.findById(input.teamId);
        if (!team) throw new TeamNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            team.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        // Quitar un equipo es un cambio de plantilla: solo antes de que la categoría empiece.
        await this.competitionGuard.assertRosterOpen(team.categoryId);

        await this.teamRepository.delete(input.teamId);
    }
}