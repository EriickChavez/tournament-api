import { DrizzleTournamentRepository } from './infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from './infrastructure/database/drizzle-tournament-member.repository.js';
import { SlugifyGenerator } from './infrastructure/slug/slugify-generator.js';
import { CreateTournamentUseCase } from './application/use-cases/create-tournament.use-case.js';
import { ListUserTournamentsUseCase } from './application/use-cases/list-user-tournaments.use-case.js';
import { ListPublicTournamentsUseCase } from './application/use-cases/list-public-tournaments.use-case.js';
import { GetTournamentUseCase } from './application/use-cases/get-tournament.use-case.js';
import { UpdateTournamentUseCase } from './application/use-cases/update-tournament.use-case.js';
import { DeleteTournamentUseCase } from './application/use-cases/delete-tournament.use-case.js';
import { TournamentController } from './presentation/tournament.controller.js';
import { createTournamentRouter } from './presentation/tournament.routes.js';
import { requireAuth } from '../auth/auth.module.js';

const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const slugGenerator = new SlugifyGenerator();

const createTournamentUseCase = new CreateTournamentUseCase(
    tournamentRepository,
    tournamentMemberRepository,
    slugGenerator,
);
const listUserTournamentsUseCase = new ListUserTournamentsUseCase(tournamentRepository);
const listPublicTournamentsUseCase = new ListPublicTournamentsUseCase(tournamentRepository);
const getTournamentUseCase = new GetTournamentUseCase(
    tournamentRepository,
    tournamentMemberRepository,
);
const updateTournamentUseCase = new UpdateTournamentUseCase(
    tournamentRepository,
    tournamentMemberRepository,
    slugGenerator,
);
const deleteTournamentUseCase = new DeleteTournamentUseCase(
    tournamentRepository,
    tournamentMemberRepository,
);

const tournamentController = new TournamentController(
    createTournamentUseCase,
    listUserTournamentsUseCase,
    listPublicTournamentsUseCase,
    getTournamentUseCase,
    updateTournamentUseCase,
    deleteTournamentUseCase,
);

export const tournamentRouter = createTournamentRouter(tournamentController, requireAuth);