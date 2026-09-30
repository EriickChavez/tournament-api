import { env } from '../../../../config/env.js';
import type { Match } from '../../domain/entities/match.entity.js';
import type { MatchRepository } from '../../domain/repositories/match.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { TeamRepository } from '../../../teams/domain/repositories/team.repository.js';
import type {
    PhaseRepository,
    PhaseGroupRepository,
} from '../../../phases/domain/repositories/phase.repository.js';
import {
    TournamentNotFoundError,
    NotTournamentOwnerOrAdminError,
} from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    InvalidCategoryForMatchError,
    InvalidTeamForMatchError,
    SameTeamMatchError,
    InvalidPhaseForMatchError,
    InvalidPhaseGroupForMatchError,
} from '../../domain/errors/match.errors.js';

function isOwnerOrAdmin(roleId: string): boolean {
    return roleId === env.OWNER_ROLE_ID || roleId === env.ADMIN_ROLE_ID;
}

export class CreateMatchUseCase {
    constructor(
        private readonly matchRepository: MatchRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly teamRepository: TeamRepository,
        private readonly phaseRepository: PhaseRepository,
        private readonly phaseGroupRepository: PhaseGroupRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
        categoryId: string;
        homeTeamId: string;
        awayTeamId: string;
        scheduledAt: Date;
        venue?: string | undefined;
        status?: Match['status'] | undefined;
        phaseId?: string | null | undefined;
        phaseGroupId?: string | null | undefined;
        round?: number | null | undefined;
    }): Promise<Match> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || !isOwnerOrAdmin(member.roleId)) {
            throw new NotTournamentOwnerOrAdminError();
        }

        if (input.homeTeamId === input.awayTeamId) {
            throw new SameTeamMatchError();
        }

        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category || category.tournamentId !== input.tournamentId) {
            throw new InvalidCategoryForMatchError();
        }

        const [homeTeam, awayTeam] = await Promise.all([
            this.teamRepository.findById(input.homeTeamId),
            this.teamRepository.findById(input.awayTeamId),
        ]);

        if (
            !homeTeam ||
            !awayTeam ||
            homeTeam.tournamentId !== input.tournamentId ||
            awayTeam.tournamentId !== input.tournamentId ||
            homeTeam.categoryId !== input.categoryId ||
            awayTeam.categoryId !== input.categoryId
        ) {
            throw new InvalidTeamForMatchError();
        }

        if (input.phaseId) {
            const phase = await this.phaseRepository.findById(input.phaseId);
            if (!phase || phase.categoryId !== input.categoryId) {
                throw new InvalidPhaseForMatchError();
            }
        }

        if (input.phaseGroupId) {
            if (!input.phaseId) throw new InvalidPhaseGroupForMatchError();
            const group = await this.phaseGroupRepository.findById(input.phaseGroupId);
            if (!group || group.phaseId !== input.phaseId) {
                throw new InvalidPhaseGroupForMatchError();
            }
        }

        return this.matchRepository.create({
            tournamentId: input.tournamentId,
            categoryId: input.categoryId,
            homeTeamId: input.homeTeamId,
            awayTeamId: input.awayTeamId,
            scheduledAt: input.scheduledAt,
            venue: input.venue,
            status: input.status,
            phaseId: input.phaseId,
            phaseGroupId: input.phaseGroupId,
            round: input.round,
            createdByUserId: input.userId,
        });
    }
}