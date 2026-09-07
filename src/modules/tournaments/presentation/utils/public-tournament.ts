import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import type { TournamentBranding } from '../../../branding/domain/entities/branding.entity.js';
import { toPublicBranding } from '../../../branding/presentation/utils/public-branding.js';

export function toPublicTournament(
    tournament: Tournament & { branding?: TournamentBranding | null },
) {
    return {
        id: tournament.id,
        name: tournament.name,
        subtitle: tournament.subtitle,
        description: tournament.description,
        slug: tournament.slug,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        timezone: tournament.timezone,
        branding: tournament.branding ? toPublicBranding(tournament.branding) : null,
    };
}

export function toPublicTournamentWithRole(
    tournament: Tournament & { roleId: string; branding?: TournamentBranding | null },
) {
    return {
        ...toPublicTournament(tournament),
        roleId: tournament.roleId,
    };
}