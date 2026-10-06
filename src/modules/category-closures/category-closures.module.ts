import { DrizzleCategoryRepository } from '../categories/infrastructure/database/drizzle-category.repository.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzlePhaseRepository } from '../phases/infrastructure/database/drizzle-phase.repository.js';
import { DrizzleBracketRepository } from '../brackets/infrastructure/database/drizzle-bracket.repository.js';
import { requireAuth } from '../auth/auth.module.js';
import { DrizzleCategoryClosureRepository } from './infrastructure/database/drizzle-category-closure.repository.js';
import { CloseCategoryUseCase } from './application/use-cases/close-category.use-case.js';
import { ReopenCategoryUseCase } from './application/use-cases/reopen-category.use-case.js';
import { ListCategoryClosuresUseCase } from './application/use-cases/list-category-closures.use-case.js';
import { CategoryClosureController } from './presentation/category-closure.controller.js';
import { createCategoryClosureRouter } from './presentation/category-closure.routes.js';

const categoryRepository = new DrizzleCategoryRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const phaseRepository = new DrizzlePhaseRepository();
const bracketRepository = new DrizzleBracketRepository();
const categoryClosureRepository = new DrizzleCategoryClosureRepository();

const closeCategory = new CloseCategoryUseCase(
    categoryRepository,
    tournamentMemberRepository,
    phaseRepository,
    bracketRepository,
    categoryClosureRepository,
);
const reopenCategory = new ReopenCategoryUseCase(
    categoryRepository,
    tournamentMemberRepository,
    categoryClosureRepository,
);
const listCategoryClosures = new ListCategoryClosuresUseCase(
    tournamentRepository,
    categoryClosureRepository,
);

export const categoryClosureRouter = createCategoryClosureRouter(
    new CategoryClosureController(closeCategory, reopenCategory, listCategoryClosures),
    requireAuth,
);