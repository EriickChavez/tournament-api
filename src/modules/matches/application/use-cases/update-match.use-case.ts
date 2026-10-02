import { env } from '../../../../config/env.js';
import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import type {
    PhaseRepository,
    PhaseGroupRepository,
} from '../../../phases/domain/repositories/phase.repository.js';
import { NotTournamentOwnerOrAdminError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    MatchNotFoundError,
    InvalidCategoryForMatchError,
    InvalidTeamForMatchError,
    SameTeamMatchError,
    InvalidPhaseForMatchError,
    InvalidPhaseGroupForMatchError,
} from '../../domain/errors/match.errors.js';
import { resolvePenalties } from '../../domain/services/match-outcome.js';
import type { MatchBracketSync } from '../ports/match-bracket-sync.port.js';

/** Puerto mínimo (mismo shape que en match-events). */
export interface MatchStatsRecalculator {
    recalculateForMatch(matchId: string): Promise<void>;
    recalculateForTeams(tournamentId: string, categoryId: string, teamIds: string[]): Promise<void>;
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
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseGroupRepository: PhaseGroupRepository,
        // Opcional: lo conecta el módulo de llaves para que el ganador avance solo.
        private readonly matchBracketSync?: MatchBracketSync,
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
        phaseId?: string | null | undefined;
        phaseGroupId?: string | null | undefined;
        round?: number | null | undefined;
        homeScore?: number | null | undefined;
        awayScore?: number | null | undefined;
        homePenalties?: number | null | undefined;
        awayPenalties?: number | null | undefined;
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

        // Valida los penales y limpia los que quedaron obsoletos si el marcador ya no es empate.
        const penalties = resolvePenalties(match, input);

        const nextCategoryId = input.categoryId ?? match.categoryId;
        const nextHomeTeamId = input.homeTeamId ?? match.homeTeamId;
        const nextAwayTeamId = input.awayTeamId ?? match.awayTeamId;
        const nextPhaseId = input.phaseId !== undefined ? input.phaseId : match.phaseId;
        const nextPhaseGroupId =
            input.phaseGroupId !== undefined ? input.phaseGroupId : match.phaseGroupId;

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

        if (input.phaseId) {
            const phase = await this.phaseRepository.findById(input.phaseId);
            if (!phase || phase.categoryId !== nextCategoryId) {
                throw new InvalidPhaseForMatchError();
            }
        }

        if (nextPhaseGroupId) {
            if (!nextPhaseId) {
                throw new InvalidPhaseGroupForMatchError();
            }
            const group = await this.phaseGroupRepository.findById(nextPhaseGroupId);
            if (!group || group.phaseId !== nextPhaseId) {
                throw new InvalidPhaseGroupForMatchError();
            }
        }

        // Antes de escribir: si el partido es parte de una llave, el cambio no debe romperla.
        await this.matchBracketSync?.assertCanApply(match, {
            homeTeamId: nextHomeTeamId,
            awayTeamId: nextAwayTeamId,
            status: input.status ?? match.status,
            homeScore: input.homeScore !== undefined ? input.homeScore : match.homeScore,
            awayScore: input.awayScore !== undefined ? input.awayScore : match.awayScore,
            homePenalties:
                penalties.homePenalties !== undefined ? penalties.homePenalties : match.homePenalties,
            awayPenalties:
                penalties.awayPenalties !== undefined ? penalties.awayPenalties : match.awayPenalties,
        });

        const previousStatus = match.status;

        const updated = await this.matchRepository.update(input.matchId, {
            categoryId: input.categoryId,
            homeTeamId: input.homeTeamId,
            awayTeamId: input.awayTeamId,
            scheduledAt: input.scheduledAt,
            venue: input.venue,
            status: input.status,
            phaseId: input.phaseId,
            phaseGroupId: input.phaseGroupId,
            round: input.round,
            homeScore: input.homeScore,
            awayScore: input.awayScore,
            homePenalties: penalties.homePenalties,
            awayPenalties: penalties.awayPenalties,
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

        // Si el partido queda finished (incluye cambiar solo el marcador de uno ya terminado), se recalcula.
        if (becameOrLeftFinished || structuralChangeOnFinished || updated.status === 'finished') {
            await this.matchStatsRecalculator.recalculateForMatch(input.matchId);
        }

        // recalculateForMatch solo ve los equipos/categoría NUEVOS. Si un partido finished
        // cambió de equipos o categoría, los anteriores se quedarían con puntos fantasma.
        if (structuralChangeOnFinished) {
            await this.matchStatsRecalculator.recalculateForTeams(match.tournamentId, match.categoryId, [
                match.homeTeamId,
                match.awayTeamId,
            ]);
        }

        // Propaga el ganador/perdedor al siguiente cruce de la llave (si el partido pertenece a una).
        await this.matchBracketSync?.sync(input.matchId);

        return updated;
    }
}