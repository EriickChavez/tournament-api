import { Tournament } from "../../domain/entities/tournaments.entity";
import { TournamentRepository } from "../../domain/repositories/tournaments.repository";

export class ListUserTournamentsUseCase {
    constructor(private readonly tournamentRepository: TournamentRepository) { }

    async execute(userId: string): Promise<Array<Tournament & { roleId: string }>> {
        return this.tournamentRepository.findAllForUser(userId);
    }
}