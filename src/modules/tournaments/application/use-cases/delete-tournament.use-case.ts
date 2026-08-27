import { env } from '../../../../config/env.js';
import { NotTournamentOwnerError, TournamentNotFoundError } from "../../domain/errors/tournaments.errors";
import { TournamentMemberRepository } from "../../domain/repositories/tournaments-member.repository";
import { TournamentRepository } from "../../domain/repositories/tournaments.repository";

export class DeleteTournamentUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
    }): Promise<void> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();
        console.log('TORNEOS')
        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );

        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        await this.tournamentRepository.delete(input.tournamentId, input.userId);
    }
}