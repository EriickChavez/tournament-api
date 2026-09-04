import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import { NotTournamentMemberError } from '../../domain/errors/tournaments.errors.js';
import type { TournamentMemberWithUser } from '../../domain/entities/tournaments-member.entity.js';
import type { Paginated, PaginationParams } from '../../../../shared/utils/pagination.js';

export class ListMembersUseCase {
    constructor(private readonly tournamentMemberRepository: TournamentMemberRepository) { }

    async execute(input: {
        tournamentId: string;
        requesterId: string;
        pagination: PaginationParams;
    }): Promise<Paginated<TournamentMemberWithUser>> {
        const requester = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.requesterId,
        );
        if (!requester) throw new NotTournamentMemberError();

        return this.tournamentMemberRepository.listByTournament(input.tournamentId, input.pagination);
    }
}