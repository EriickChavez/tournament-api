import { DrizzleSuperAdminRepository } from './infrastructure/database/drizzle-super-admin.repository.js';
import { DrizzleSuperAdminSessionRepository } from './infrastructure/database/drizzle-super-admin-session.repository.js';
import { Argon2PasswordHasher } from '../auth/infrastructure/security/argon2-password-hasher.js';
import { RegisterSuperAdminUseCase } from './application/use-cases/register-super-admin.use-case.js';
import { LoginSuperAdminUseCase } from './application/use-cases/login-super-admin.use-case.js';
import { LogoutSuperAdminUseCase } from './application/use-cases/logout-super-admin.use-case.js';
import { LogoutAllSuperAdminUseCase } from './application/use-cases/logout-all-super-admin.use-case.js';
import { GetCurrentSuperAdminUseCase } from './application/use-cases/get-current-super-admin.use-case.js';
import { SuperAdminController } from './presentation/super-admin.controller.js';
import { createSuperAdminRouter } from './presentation/super-admin.routes.js';
import { createRequireSuperAuth } from './presentation/middleware/require-super-auth.middleware.js';
import { ListAllMembersUseCase } from './application/use-cases/list-all-members.use-case.js';

const superAdminRepository = new DrizzleSuperAdminRepository();
const superAdminSessionRepository = new DrizzleSuperAdminSessionRepository();
const passwordHasher = new Argon2PasswordHasher();

const registerUseCase = new RegisterSuperAdminUseCase(superAdminRepository, passwordHasher);
const loginUseCase = new LoginSuperAdminUseCase(superAdminRepository, superAdminSessionRepository, passwordHasher);
const logoutUseCase = new LogoutSuperAdminUseCase(superAdminSessionRepository);
const logoutAllUseCase = new LogoutAllSuperAdminUseCase(superAdminSessionRepository);
const getCurrentSuperAdminUseCase = new GetCurrentSuperAdminUseCase(superAdminRepository);
const listAllMembersUseCase = new ListAllMembersUseCase();

const superAdminController = new SuperAdminController(
    registerUseCase,
    loginUseCase,
    logoutUseCase,
    logoutAllUseCase,
    getCurrentSuperAdminUseCase,
    listAllMembersUseCase,
);

export const requireSuperAuth = createRequireSuperAuth(superAdminSessionRepository, superAdminRepository);
export const superAdminRouter = createSuperAdminRouter(superAdminController, requireSuperAuth);