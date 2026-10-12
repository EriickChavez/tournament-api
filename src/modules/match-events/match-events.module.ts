import { DrizzleMatchEventRepository } from './infrastructure/database/drizzle-match-event.repository.js';
import { DrizzleMatchRepository } from '../matches/infrastructure/database/drizzle-match.repository.js';
import { DrizzleMatchRefereeRepository } from '../matches/infrastructure/database/drizzle-match-referee.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzlePlayerRepository } from '../players/infrastructure/database/drizzle-player.repository.js';
import { CreateMatchEventUseCase } from './application/use-cases/create-match-event.use-case.js';
import { UpdateMatchEventUseCase } from './application/use-cases/update-match-event.use-case.js';
import { DeleteMatchEventUseCase } from './application/use-cases/delete-match-event.use-case.js';
import { ListMatchEventsUseCase } from './application/use-cases/list-match-events.use-case.js';
import { MatchEventController } from './presentation/match-event.controller.js';
import { createMatchEventRouter, createStandaloneMatchEventRouter } from './presentation/match-event.routes.js';
import { requireAuth } from '../auth/auth.module.js';
import { competitionGuard } from '../competition-state/competition-state.module.js';

const matchEventRepository = new DrizzleMatchEventRepository();
const matchRepository = new DrizzleMatchRepository();
const matchRefereeRepository = new DrizzleMatchRefereeRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const playerRepository = new DrizzlePlayerRepository();

const createMatchEventUseCase = new CreateMatchEventUseCase(
    matchEventRepository, matchRepository, tournamentMemberRepository,
    playerRepository, competitionGuard, matchRefereeRepository,
);

const updateMatchEventUseCase = new UpdateMatchEventUseCase(
    matchEventRepository, matchRepository, tournamentMemberRepository,
    playerRepository, competitionGuard, matchRefereeRepository,
);

const deleteMatchEventUseCase = new DeleteMatchEventUseCase(
    matchEventRepository, tournamentMemberRepository, matchRepository,
    competitionGuard, matchRefereeRepository,
);

const listMatchEventsUseCase = new ListMatchEventsUseCase(matchEventRepository, matchRepository);

const matchEventController = new MatchEventController(
    createMatchEventUseCase,
    deleteMatchEventUseCase,
    listMatchEventsUseCase,
    updateMatchEventUseCase,
);

export const matchEventRouter = createMatchEventRouter(matchEventController, requireAuth);
export const standaloneMatchEventRouter = createStandaloneMatchEventRouter(matchEventController, requireAuth);