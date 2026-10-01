import {
    DrizzlePhaseRepository,
    DrizzlePhaseGroupRepository,
    DrizzlePhaseTeamRepository,
} from './infrastructure/database/drizzle-phase.repository.js';
import { DrizzleMatchRepository } from '../matches/infrastructure/database/drizzle-match.repository.js';
import { DrizzleMatchEventRepository } from '../match-events/infrastructure/database/drizzle-match-event.repository.js';
import { GetPhaseStandingsUseCase } from './application/use-cases/get-phase-standings.use-case.js';
import { PhaseStandingsController } from './presentation/phase-standings.controller.js';
import { createPhaseStandingsRouter } from './presentation/phase-standings.routes.js';

const getPhaseStandings = new GetPhaseStandingsUseCase(
    new DrizzlePhaseRepository(),
    new DrizzlePhaseGroupRepository(),
    new DrizzlePhaseTeamRepository(),
    new DrizzleMatchRepository(),
    new DrizzleMatchEventRepository(),
);

export const phaseStandingsRouter = createPhaseStandingsRouter(
    new PhaseStandingsController(getPhaseStandings),
);