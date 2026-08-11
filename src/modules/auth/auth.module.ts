import { DrizzleUserRepository } from './infrastructure/database/drizzle-user.repository.js';
import { DrizzleSessionRepository } from './infrastructure/database/drizzle-session.repository.js';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher.js';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case.js';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case.js';
import { LogoutUserUseCase } from './application/use-cases/logout-user.use-case.js';
import { AuthController } from './presentation/auth.controller.js';
import { createAuthRouter } from './presentation/auth.routes.js';
import { createRequireAuth } from './presentation/middleware/require-auth.middleware.js';


const userRepository = new DrizzleUserRepository();
const sessionRepository = new DrizzleSessionRepository();
const passwordHasher = new Argon2PasswordHasher();

const registerUseCase = new RegisterUserUseCase(userRepository, sessionRepository, passwordHasher);
const loginUseCase = new LoginUserUseCase(userRepository, sessionRepository, passwordHasher);
const logoutUseCase = new LogoutUserUseCase(sessionRepository);

const authController = new AuthController(registerUseCase, loginUseCase, logoutUseCase);

export const authRouter = createAuthRouter(authController);
export const requireAuth = createRequireAuth(sessionRepository, userRepository);
