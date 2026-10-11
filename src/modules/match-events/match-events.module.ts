import { DrizzleMatchEventRepository } from './infrastructure/database/drizzle-match-event.repository.js';
import { DrizzleMatchRepository } from '../matches/infrastructure/database/drizzle-match.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzlePlayerRepository } from '../players/infrastructure/database/drizzle-player.repository.js';
import { CreateMatchEventUseCase } from './application/use-cases/create-match-event.use-case.js';
import { DeleteMatchEventUseCase } from './application/use-cases/delete-match-event.use-case.js';
import { ListMatchEventsUseCase } from './application/use-cases/list-match-events.use-case.js';
import { MatchEventController } from './presentation/match-event.controller.js';
import { createMatchEventRouter, createStandaloneMatchEventRouter } from './presentation/match-event.routes.js';
import { requireAuth } from '../auth/auth.module.js';
import { recalculateMatchStatsService } from '../standings/standings.module.js';

const matchEventRepository = new DrizzleMatchEventRepository();
const matchRepository = new DrizzleMatchRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const playerRepository = new DrizzlePlayerRepository();
import { competitionGuard } from '../competition-state/competition-state.module.js';

const createMatchEventUseCase = new CreateMatchEventUseCase(
    matchEventRepository, matchRepository, tournamentMemberRepository,
    playerRepository, recalculateMatchStatsService, competitionGuard,
);

const deleteMatchEventUseCase = new DeleteMatchEventUseCase(
    matchEventRepository, tournamentMemberRepository, recalculateMatchStatsService,
    matchRepository, competitionGuard,
);

const listMatchEventsUseCase = new ListMatchEventsUseCase(matchEventRepository, matchRepository);

const matchEventController = new MatchEventController(
    createMatchEventUseCase,
    deleteMatchEventUseCase,
    listMatchEventsUseCase,
);

export const matchEventRouter = createMatchEventRouter(matchEventController, requireAuth);
export const standaloneMatchEventRouter = createStandaloneMatchEventRouter(matchEventController, requireAuth);