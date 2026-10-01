import {
    DrizzlePhaseRepository,
    DrizzlePhaseGroupRepository,
    DrizzlePhaseTeamRepository,
} from './infrastructure/database/drizzle-phase.repository.js';
import { DrizzlePhaseManualRankRepository } from './infrastructure/database/drizzle-phase-manual-rank.repository.js';
import { DrizzleMatchRepository } from '../matches/infrastructure/database/drizzle-match.repository.js';
import { DrizzleMatchEventRepository } from '../match-events/infrastructure/database/drizzle-match-event.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { requireAuth } from '../auth/auth.module.js';
import { GetPhaseStandingsUseCase } from './application/use-cases/get-phase-standings.use-case.js';
import { SetPhaseManualRanksUseCase } from './application/use-cases/set-phase-manual-ranks.use-case.js';
import { PhaseStandingsController } from './presentation/phase-standings.controller.js';
import { createPhaseStandingsRouter } from './presentation/phase-standings.routes.js';

const phaseRepository = new DrizzlePhaseRepository();
const phaseGroupRepository = new DrizzlePhaseGroupRepository();
const phaseTeamRepository = new DrizzlePhaseTeamRepository();
const phaseManualRankRepository = new DrizzlePhaseManualRankRepository();
const matchRepository = new DrizzleMatchRepository();
const matchEventRepository = new DrizzleMatchEventRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();

const getPhaseStandings = new GetPhaseStandingsUseCase(
    phaseRepository,
    phaseGroupRepository,
    phaseTeamRepository,
    matchRepository,
    matchEventRepository,
    phaseManualRankRepository,
);

const setPhaseManualRanks = new SetPhaseManualRanksUseCase(
    phaseRepository,
    phaseTeamRepository,
    phaseManualRankRepository,
    tournamentMemberRepository,
);

export const phaseStandingsRouter = createPhaseStandingsRouter(
    new PhaseStandingsController(getPhaseStandings, setPhaseManualRanks),
    requireAuth,
);