import { DrizzleTeamStandingRepository } from './infrastructure/database/drizzle-team-standing.repository.js';
import { DrizzleTopScorerRepository } from './infrastructure/database/drizzle-top-scorer.repository.js';
import { DrizzleCardCountRepository } from './infrastructure/database/drizzle-card-count.repository.js';
import { DrizzleMatchRepository } from '../matches/infrastructure/database/drizzle-match.repository.js';
import { DrizzleMatchEventRepository } from '../match-events/infrastructure/database/drizzle-match-event.repository.js';
import { RecalculateMatchStatsService } from './application/services/recalculate-match-stats.service.js';
import { StandingsController } from './presentation/standings.controller.js';
import { createStandingsRouter } from './presentation/standings.routes.js';

const teamStandingRepository = new DrizzleTeamStandingRepository();
const topScorerRepository = new DrizzleTopScorerRepository();
const cardCountRepository = new DrizzleCardCountRepository();
const matchRepository = new DrizzleMatchRepository();
const matchEventRepository = new DrizzleMatchEventRepository();

export const recalculateMatchStatsService = new RecalculateMatchStatsService(
    matchRepository,
    matchEventRepository,
    teamStandingRepository,
    topScorerRepository,
    cardCountRepository,
);

const standingsController = new StandingsController(teamStandingRepository, topScorerRepository, cardCountRepository);
export const standingsRouter = createStandingsRouter(standingsController);
