import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleCategoryRepository } from '../categories/infrastructure/database/drizzle-category.repository.js';
import { DrizzleCategoryClosureRepository } from '../category-closures/infrastructure/database/drizzle-category-closure.repository.js';
import { DrizzleCompetitionStateRepository } from './infrastructure/database/drizzle-competition-state.repository.js';
import { CompetitionGuardService } from './application/services/competition-guard.service.js';
import { GetCompetitionStateUseCase } from './application/use-cases/get-competition-state.use-case.js';
import { CompetitionStateController } from './presentation/competition-state.controller.js';
import { createCompetitionStateRouter } from './presentation/competition-state.routes.js';

const tournamentRepository = new DrizzleTournamentRepository();
const categoryRepository = new DrizzleCategoryRepository();
const categoryClosureRepository = new DrizzleCategoryClosureRepository();
const competitionStateRepository = new DrizzleCompetitionStateRepository();

// Lo usan teams, players e imports para impedir cambios en la plantilla (mismo patrón que bracketAdvancer).
export const competitionGuard = new CompetitionGuardService(
    competitionStateRepository,
    categoryClosureRepository,
);

const getCompetitionState = new GetCompetitionStateUseCase(
    tournamentRepository,
    categoryRepository,
    competitionStateRepository,
    categoryClosureRepository,
);

export const competitionStateRouter = createCompetitionStateRouter(
    new CompetitionStateController(getCompetitionState),
);