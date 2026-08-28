import type { Player } from '../../domain/entities/player.entity.js';

export function toPublicPlayer(player: Player) {
    return {
        id: player.id,
        tournamentId: player.tournamentId,
        categoryId: player.categoryId,
        teamId: player.teamId,
        firstName: player.firstName,
        lastName: player.lastName,
        birthDate: player.birthDate,
        number: player.number,
        isCaptain: player.isCaptain,
        role: player.role,
    };
}
