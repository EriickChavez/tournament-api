import { DrizzleTeamRepository } from './infrastructure/database/drizzle-team.repository.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzleCategoryRepository } from '../categories/infrastructure/database/drizzle-category.repository.js';
import { CreateTeamUseCase } from './application/use-cases/create-team.use-case.js';
import { UpdateTeamUseCase } from './application/use-cases/update-team.use-case.js';
import { DeleteTeamUseCase } from './application/use-cases/delete-team.use-case.js';
import { ListTeamsUseCase } from './application/use-cases/list-teams.use-case.js';
import { TeamController } from './presentation/team.controller.js';
import { createTeamRouter, createTournamentTeamRouter } from './presentation/team.routes.js';
import { requireAuth } from '../auth/auth.module.js';

const teamRepository = new DrizzleTeamRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const categoryRepository = new DrizzleCategoryRepository();

const createTeamUseCase = new CreateTeamUseCase(
    teamRepository,
    tournamentRepository,
    tournamentMemberRepository,
    categoryRepository,
);
const updateTeamUseCase = new UpdateTeamUseCase(teamRepository, tournamentMemberRepository, categoryRepository);
const deleteTeamUseCase = new DeleteTeamUseCase(teamRepository, tournamentMemberRepository);
const listTeamsUseCase = new ListTeamsUseCase(teamRepository, tournamentRepository);

const teamController = new TeamController(createTeamUseCase, updateTeamUseCase, deleteTeamUseCase, listTeamsUseCase);

export const tournamentTeamRouter = createTournamentTeamRouter(teamController, requireAuth);
export const teamRouter = createTeamRouter(teamController, requireAuth);