import { PaginationParams } from '../../../../shared/utils/pagination.js';
import type { Player } from '../entities/player.entity.js';
import type { Paginated } from '../../../../shared/utils/pagination.js';

export interface PlayerRepository {
    findById(id: string): Promise<Player | null>;
    findByTeamAndNumber(teamId: string, number: number): Promise<Player | null>;
    findByTournamentId(tournamentId: string, pagination: PaginationParams): Promise<Paginated<Player>>;
    create(input: {
        tournamentId: string;
        categoryId: string;
        teamId: string;
        firstName: string;
        lastName: string;
        birthDate?: string | null | undefined;
        number: number;
        isCaptain?: boolean | undefined;
        role?: string | null | undefined;
        createdByUserId: string;
    }): Promise<Player>;
    update(
        id: string,
        input: {
            categoryId?: string | undefined;
            teamId?: string | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            birthDate?: string | null | undefined;
            number?: number | undefined;
            isCaptain?: boolean | undefined;
            role?: string | null | undefined;
            updatedByUserId: string;
        },
    ): Promise<Player>;
    delete(id: string): Promise<void>;
}