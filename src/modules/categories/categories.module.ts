import { DrizzleCategoryRepository } from './infrastructure/database/drizzle-category.repository.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case.js';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case.js';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case.js';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case.js';
import { CategoryController } from './presentation/category.controller.js';
import {
    createCategoryRouter,
    createTournamentCategoryRouter,
} from './presentation/category.routes.js';
import { requireAuth } from '../auth/auth.module.js';

const categoryRepository = new DrizzleCategoryRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();

const listCategoriesUseCase = new ListCategoriesUseCase(
    categoryRepository,
    tournamentRepository,
);
const createCategoryUseCase = new CreateCategoryUseCase(
    categoryRepository,
    tournamentRepository,
    tournamentMemberRepository,
);
const updateCategoryUseCase = new UpdateCategoryUseCase(
    categoryRepository,
    tournamentMemberRepository,
);
const deleteCategoryUseCase = new DeleteCategoryUseCase(
    categoryRepository,
    tournamentMemberRepository,
);

export const categoryController = new CategoryController(
    listCategoriesUseCase,
    createCategoryUseCase,
    updateCategoryUseCase,
    deleteCategoryUseCase,
);

export const tournamentCategoryRouter = createTournamentCategoryRouter(
    categoryController,
    requireAuth,
);
export const categoryRouter = createCategoryRouter(categoryController, requireAuth);
