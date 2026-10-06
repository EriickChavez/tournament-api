import { env } from '../../../../config/env.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import type { PhaseRepository } from '../../../phases/domain/repositories/phase.repository.js';
import type { BracketRepository } from '../../../brackets/domain/repositories/bracket.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import { CategoryNotFoundError } from '../../../categories/domain/errors/category.errors.js';
import type { CategoryClosure } from '../../domain/entities/category-closure.entity.js';
import type { CategoryClosureRepository } from '../../domain/repositories/category-closure.repository.js';
import {
    CategoryAlreadyClosedError,
    ChampionNotDecidedError,
} from '../../domain/errors/category-closure.errors.js';

export class CloseCategoryUseCase {
    constructor(
        private readonly categoryRepository: CategoryRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly phaseRepository: PhaseRepository,
        private readonly bracketRepository: BracketRepository,
        private readonly categoryClosureRepository: CategoryClosureRepository,
    ) { }

    async execute(input: {
        tournamentId: string;
        categoryId: string;
        userId: string;
    }): Promise<CategoryClosure> {
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

        if (await this.categoryClosureRepository.isClosed(category.id)) {
            throw new CategoryAlreadyClosedError();
        }

        const championTeamId = await this.findChampion(category.id);
        if (!championTeamId) throw new ChampionNotDecidedError();

        return this.categoryClosureRepository.close({
            tournamentId: input.tournamentId,
            categoryId: category.id,
            championTeamId,
            userId: input.userId,
        });
    }

    /**
     * El campeón es el ganador de la final de la última fase de eliminatoria de la categoría
     * que ya la tenga decidida. La final es el cruce del cuadro principal con la ronda más alta.
     */
    private async findChampion(categoryId: string): Promise<string | null> {
        const phases = (await this.phaseRepository.findByCategoryId(categoryId))
            .filter((phase) => phase.type === 'knockout')
            .sort((a, b) => b.sortOrder - a.sortOrder);

        for (const phase of phases) {
            const nodes = await this.bracketRepository.findByPhaseId(phase.id);
            const main = nodes.filter((node) => node.stage === 'main');
            if (main.length === 0) continue;

            const finalRound = Math.max(...main.map((node) => node.round));
            const final = main.find((node) => node.round === finalRound);
            if (final?.winnerTeamId) return final.winnerTeamId;
        }
        return null;
    }
}