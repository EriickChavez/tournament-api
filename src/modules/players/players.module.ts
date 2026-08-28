import { DrizzlePlayerRepository } from './infrastructure/database/drizzle-player.repository.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzleCategoryRepository } from '../categories/infrastructure/database/drizzle-category.repository.js';
import { DrizzleTeamRepository } from '../teams/infrastructure/database/drizzle-team.repository.js';
import { CreatePlayerUseCase } from './application/use-cases/create-player.use-case.js';
import { UpdatePlayerUseCase } from './application/use-cases/update-player.use-case.js';
import { DeletePlayerUseCase } from './application/use-cases/delete-player.use-case.js';
import { ListPlayersUseCase } from './application/use-cases/list-players.use-case.js';
import { PlayerController } from './presentation/player.controller.js';
import { createPlayerRouter, createTournamentPlayerRouter } from './presentation/player.routes.js';
import { requireAuth } from '../auth/auth.module.js';

const playerRepository = new DrizzlePlayerRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const categoryRepository = new DrizzleCategoryRepository();
const teamRepository = new DrizzleTeamRepository();

const createPlayerUseCase = new CreatePlayerUseCase(
    playerRepository,
    tournamentRepository,
    tournamentMemberRepository,
    categoryRepository,
    teamRepository,
);
const updatePlayerUseCase = new UpdatePlayerUseCase(
    playerRepository,
    tournamentMemberRepository,
    categoryRepository,
    teamRepository,
);
const deletePlayerUseCase = new DeletePlayerUseCase(playerRepository, tournamentMemberRepository);
const listPlayersUseCase = new ListPlayersUseCase(playerRepository, tournamentRepository);

const playerController = new PlayerController(
    createPlayerUseCase,
    updatePlayerUseCase,
    deletePlayerUseCase,
    listPlayersUseCase,
);

export const tournamentPlayerRouter = createTournamentPlayerRouter(playerController, requireAuth);
export const playerRouter = createPlayerRouter(playerController, requireAuth);