import { DrizzleTournamentRepository } from './infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from './infrastructure/database/drizzle-tournament-member.repository.js';
import { SlugifyGenerator } from './infrastructure/slug/slugify-generator.js';
import { CreateTournamentUseCase } from './application/use-cases/create-tournament.use-case.js';
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
const tournamentController = new TournamentController(createTournamentUseCase);

export const tournamentRouter = createTournamentRouter(tournamentController, requireAuth);
