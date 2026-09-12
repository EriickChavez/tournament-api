import { DrizzleSuperAdminRepository } from './infrastructure/database/drizzle-super-admin.repository.js';
import { DrizzleSuperAdminSessionRepository } from './infrastructure/database/drizzle-super-admin-session.repository.js';
import { RegisterSuperAdminUseCase } from './application/use-cases/register-super-admin.use-case.js';
import { LoginSuperAdminUseCase } from './application/use-cases/login-super-admin.use-case.js';
import { LogoutSuperAdminUseCase } from './application/use-cases/logout-super-admin.use-case.js';
import { LogoutAllSuperAdminUseCase } from './application/use-cases/logout-all-super-admin.use-case.js';
import { GetCurrentSuperAdminUseCase } from './application/use-cases/get-current-super-admin.use-case.js';
import { ListAllUsersUseCase } from './application/use-cases/list-all-users.use-case.js';
import { ListLookupOptionsUseCase } from './application/use-cases/list-lookup-options.use-case.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { UpdateMemberUseCase } from './application/use-cases/update-member.use-case.js';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case.js';
import { UpdateTournamentMaxSponsorsUseCase } from './application/use-cases/update-tournament-max-sponsors.use-case.js';
import { ListAllTournamentsUseCase } from './application/use-cases/list-all-tournaments.use-case.js';
import { SuperAdminController } from './presentation/super-admin.controller.js';
import { createSuperAdminRouter } from './presentation/super-admin.routes.js';
import { createRequireSuperAuth } from './presentation/middleware/require-super-auth.middleware.js';
import { DrizzleUserRepository } from '../auth/infrastructure/database/drizzle-user.repository.js';
import { Argon2PasswordHasher } from '../auth/infrastructure/security/argon2-password-hasher.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';

const superAdminRepository = new DrizzleSuperAdminRepository();
const superAdminSessionRepository = new DrizzleSuperAdminSessionRepository();

const passwordHasher = new Argon2PasswordHasher();
const userRepository = new DrizzleUserRepository();
const tournamentRepository = new DrizzleTournamentRepository();

const registerUseCase = new RegisterSuperAdminUseCase(superAdminRepository, passwordHasher);
const loginUseCase = new LoginSuperAdminUseCase(
    superAdminRepository,
    superAdminSessionRepository,
    passwordHasher,
);
const logoutUseCase = new LogoutSuperAdminUseCase(superAdminSessionRepository);
const logoutAllUseCase = new LogoutAllSuperAdminUseCase(superAdminSessionRepository);
const getCurrentSuperAdminUseCase = new GetCurrentSuperAdminUseCase(superAdminRepository);
const listAllUsersUseCase = new ListAllUsersUseCase();
const listLookupOptionsUseCase = new ListLookupOptionsUseCase();
const createUserUseCase = new CreateUserUseCase(userRepository, passwordHasher);
const updateMemberUseCase = new UpdateMemberUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase();
const updateTournamentMaxSponsorsUseCase = new UpdateTournamentMaxSponsorsUseCase(
    tournamentRepository,
);
const listAllTournamentsUseCase = new ListAllTournamentsUseCase(tournamentRepository);

const superAdminController = new SuperAdminController(
    registerUseCase,
    loginUseCase,
    logoutUseCase,
    logoutAllUseCase,
    getCurrentSuperAdminUseCase,
    listAllUsersUseCase,
    listLookupOptionsUseCase,
    createUserUseCase,
    updateMemberUseCase,
    deleteUserUseCase,
    updateTournamentMaxSponsorsUseCase,
    listAllTournamentsUseCase,
);

export const requireSuperAuth = createRequireSuperAuth(
    superAdminSessionRepository,
    superAdminRepository,
);
export const superAdminRouter = createSuperAdminRouter(superAdminController, requireSuperAuth);