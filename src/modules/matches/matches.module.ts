import { DrizzleMatchRepository } from './infrastructure/database/drizzle-match.repository.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzleCategoryRepository } from '../categories/infrastructure/database/drizzle-category.repository.js';
import { DrizzleTeamRepository } from '../teams/infrastructure/database/drizzle-team.repository.js';
import { CreateMatchUseCase } from './application/use-cases/create-match.use-case.js';
import { UpdateMatchUseCase } from './application/use-cases/update-match.use-case.js';
import { DeleteMatchUseCase } from './application/use-cases/delete-match.use-case.js';
import { ListMatchesUseCase } from './application/use-cases/list-matches.use-case.js';
import { GetMatchUseCase } from './application/use-cases/get-match.use-case.js';
import { MatchController } from './presentation/match.controller.js';
import { createMatchRouter, createTournamentMatchRouter } from './presentation/match.routes.js';
import { requireAuth } from '../auth/auth.module.js';
import { recalculateMatchStatsService } from '../standings/standings.module.js';

const matchRepository = new DrizzleMatchRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const categoryRepository = new DrizzleCategoryRepository();
const teamRepository = new DrizzleTeamRepository();

const createMatchUseCase = new CreateMatchUseCase(
    matchRepository,
    tournamentRepository,
    tournamentMemberRepository,
    categoryRepository,
    teamRepository,
);
const updateMatchUseCase = new UpdateMatchUseCase(
    matchRepository,
    tournamentMemberRepository,
    categoryRepository,
    teamRepository,
    recalculateMatchStatsService,
);
const deleteMatchUseCase = new DeleteMatchUseCase(matchRepository, tournamentMemberRepository);
const listMatchesUseCase = new ListMatchesUseCase(
    matchRepository,
    tournamentRepository,
    teamRepository,
    categoryRepository,
);
const getMatchUseCase = new GetMatchUseCase(
    matchRepository,
    teamRepository,
    categoryRepository,
    tournamentMemberRepository,
);

const matchController = new MatchController(
    createMatchUseCase,
    updateMatchUseCase,
    deleteMatchUseCase,
    listMatchesUseCase,
    getMatchUseCase,
);

export const tournamentMatchRouter = createTournamentMatchRouter(matchController, requireAuth);
export const matchRouter = createMatchRouter(matchController, requireAuth);