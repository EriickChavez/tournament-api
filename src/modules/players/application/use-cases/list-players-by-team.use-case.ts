import type { Player } from '../../domain/entities/player.entity.js';
import type { PlayerRepository } from '../../domain/repositories/player.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import { TeamNotFoundError } from '../../../teams/domain/errors/team.errors.js';
import { Paginated, PaginationParams } from '../../../../shared/utils/pagination.js';

export class ListPlayersByTeamUseCase {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly teamRepository: TeamRepository,
    ) { }

    async execute(teamId: string, pagination: PaginationParams): Promise<Paginated<Player>> {
        const team = await this.teamRepository.findById(teamId);
        if (!team) throw new TeamNotFoundError();
        return this.playerRepository.findByTeamId(teamId, pagination);
    }
}