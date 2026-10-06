import { env } from '../../../../config/env.js';
import type { Phase, PhaseType, PhaseStatus } from '../../domain/entities/phase.entity.js';
import type { PhaseRepository } from '../../domain/repositories/phase.repository.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import {
    TournamentNotFoundError,
    NotTournamentOwnerError,
} from '../../../tournaments/domain/errors/tournaments.errors.js';
import { CategoryNotFoundError } from '../../../categories/domain/errors/category.errors.js';
import { InvalidPhaseDateRangeError } from '../../domain/errors/phase.errors.js';
import { CategoryClosedError } from '../../domain/errors/phase-category-closed.errors.js';
import type { CategoryClosureChecker } from '../ports/category-closure-checker.port.js';

export class CreatePhaseUseCase {
    constructor(
        private readonly phaseRepository: PhaseRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly categoryClosureChecker: CategoryClosureChecker,
    ) { }

    async execute(input: {
        tournamentId: string;
        categoryId: string;
        userId: string;
        name: string;
        type: PhaseType;
        status?: PhaseStatus | undefined;
        sortOrder?: number | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
    }): Promise<Phase> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category || category.tournamentId !== input.tournamentId) {
            throw new CategoryNotFoundError();
        }

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        // Con el campeonato cerrado no se agregan fases a la categoría.
        if (await this.categoryClosureChecker.isClosed(input.categoryId)) {
            throw new CategoryClosedError();
        }

        if (input.startDate && input.endDate && input.endDate < input.startDate) {
            throw new InvalidPhaseDateRangeError();
        }

        return this.phaseRepository.create({
            tournamentId: input.tournamentId,
            categoryId: input.categoryId,
            name: input.name,
            type: input.type,
            status: input.status,
            sortOrder: input.sortOrder,
            startDate: input.startDate,
            endDate: input.endDate,
            createdByUserId: input.userId,
        });
    }
}