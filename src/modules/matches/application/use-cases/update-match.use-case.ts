import { env } from '../../../../config/env.js';
import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    MatchNotFoundError,
    InvalidCategoryForMatchError,
    InvalidTeamForMatchError,
    SameTeamMatchError,
} from '../../domain/errors/match.errors.js';

/** Puerto mínimo (mismo shape que en match-events). */
export interface MatchStatsRecalculator {
    recalculateForMatch(matchId: string): Promise<void>;
}

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class UpdateMatchUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly teamRepository: TeamRepository,
        private readonly matchStatsRecalculator: MatchStatsRecalculator,
    ) { }

    async execute(input: {
        matchId: string;
        userId: string;
        categoryId?: string | undefined;
        homeTeamId?: string | undefined;
        awayTeamId?: string | undefined;
        scheduledAt?: Date | undefined;
        venue?: string | null | undefined;
        status?: MatchStatus | undefined;
    }): Promise<Match> {
        const match = await this.matchRepository.findById(input.matchId);
        if (!match) throw new MatchNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            match.tournamentId,
            input.userId,
        );
        if (!member || !isOwnerOrAdmin(member.roleId)) {
            throw new NotTournamentOwnerOrAdminError();
        }

        const nextCategoryId = input.categoryId ?? match.categoryId;
        const nextHomeTeamId = input.homeTeamId ?? match.homeTeamId;
        const nextAwayTeamId = input.awayTeamId ?? match.awayTeamId;

        if (nextHomeTeamId === nextAwayTeamId) {
            throw new SameTeamMatchError();
        }

        if (input.categoryId) {
            const category = await this.categoryRepository.findById(input.categoryId);
            if (!category || category.tournamentId !== match.tournamentId) {
                throw new InvalidCategoryForMatchError();
            }

        }

        if (input.categoryId || input.homeTeamId || input.awayTeamId) {
            const [homeTeam, awayTeam] = await Promise.all([
                this.teamRepository.findById(nextHomeTeamId),
                this.teamRepository.findById(nextAwayTeamId),
            ]);

            if (
                !homeTeam ||
                !awayTeam ||
                homeTeam.tournamentId !== match.tournamentId ||
                awayTeam.tournamentId !== match.tournamentId ||
                homeTeam.categoryId !== nextCategoryId ||
                awayTeam.categoryId !== nextCategoryId
            ) {
                throw new InvalidTeamForMatchError();
            }
        }

        const previousStatus = match.status;

        const updated = await this.matchRepository.update(input.matchId, {
            categoryId: input.categoryId,
            homeTeamId: input.homeTeamId,
            awayTeamId: input.awayTeamId,
            scheduledAt: input.scheduledAt,
            venue: input.venue,
            status: input.status,
            updatedByUserId: input.userId,
        });

        // Recalcular si entra/sale de finished, o si un partido finished cambia de equipos/categoría.
        const becameOrLeftFinished =
            input.status !== undefined &&
            input.status !== previousStatus &&
            (input.status === 'finished' || previousStatus === 'finished');

        const structuralChangeOnFinished =
            previousStatus === 'finished' &&
            (input.categoryId !== undefined ||
                input.homeTeamId !== undefined ||
                input.awayTeamId !== undefined);

        if (becameOrLeftFinished || structuralChangeOnFinished || updated.status === 'finished') {
            await this.matchStatsRecalculator.recalculateForMatch(input.matchId);
        }

        return updated;
    }
}