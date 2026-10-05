import { DrizzlePhaseRepository } from '../phases/infrastructure/database/drizzle-phase.repository.js';
import { DrizzlePhaseGroupRepository } from '../phases/infrastructure/database/drizzle-phase.repository.js';
import { DrizzlePhaseClosureRepository } from '../phases/infrastructure/database/drizzle-phase-closure.repository.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzleCategoryRepository } from '../categories/infrastructure/database/drizzle-category.repository.js';
import { DrizzleTeamRepository } from '../teams/infrastructure/database/drizzle-team.repository.js';
import { DrizzleMatchRepository } from '../matches/infrastructure/database/drizzle-match.repository.js';
import { CreateMatchUseCase } from '../matches/application/use-cases/create-match.use-case.js';
import { requireAuth } from '../auth/auth.module.js';
import { DrizzleBracketRepository } from './infrastructure/database/drizzle-bracket.repository.js';
import { BracketAdvancer } from './application/services/bracket-advancer.service.js';
import { GenerateBracketUseCase } from './application/use-cases/generate-bracket.use-case.js';
import { GetBracketUseCase } from './application/use-cases/get-bracket.use-case.js';
import { DeleteBracketUseCase } from './application/use-cases/delete-bracket.use-case.js';
import { ScheduleBracketMatchUseCase } from './application/use-cases/schedule-bracket-match.use-case.js';
import { SetBracketNodePenaltiesUseCase } from './application/use-cases/set-bracket-node-penalties.use-case.js';
import { BracketController } from './presentation/bracket.controller.js';
import { createBracketRouter } from './presentation/bracket.routes.js';

const phaseRepository = new DrizzlePhaseRepository();
const phaseGroupRepository = new DrizzlePhaseGroupRepository();
const phaseClosureRepository = new DrizzlePhaseClosureRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const categoryRepository = new DrizzleCategoryRepository();
const teamRepository = new DrizzleTeamRepository();
const matchRepository = new DrizzleMatchRepository();
const bracketRepository = new DrizzleBracketRepository();

// Lo usa el módulo de partidos para que el ganador avance solo (mismo patrón que standings).
export const bracketAdvancer = new BracketAdvancer(bracketRepository, matchRepository);

// Misma creación de partidos que usa /tournaments/:id/matches (los repositorios no guardan estado).
const createMatch = new CreateMatchUseCase(
    matchRepository,
    tournamentRepository,
    tournamentMemberRepository,
    categoryRepository,
    teamRepository,
    phaseRepository,
    phaseGroupRepository,
);

const getBracket = new GetBracketUseCase(phaseRepository, bracketRepository);

const generateBracket = new GenerateBracketUseCase(
    phaseRepository,
    phaseClosureRepository,
    tournamentMemberRepository,
    bracketRepository,
);

const deleteBracket = new DeleteBracketUseCase(
    phaseRepository,
    tournamentMemberRepository,
    bracketRepository,
);

const scheduleBracketMatch = new ScheduleBracketMatchUseCase(
    phaseRepository,
    bracketRepository,
    matchRepository,
    createMatch,
);

const setBracketNodePenalties = new SetBracketNodePenaltiesUseCase(
    phaseRepository,
    tournamentMemberRepository,
    bracketRepository,
    bracketAdvancer,
);

export const bracketRouter = createBracketRouter(
    new BracketController(
        getBracket,
        generateBracket,
        scheduleBracketMatch,
        setBracketNodePenalties,
        deleteBracket,
    ),
    requireAuth,
);