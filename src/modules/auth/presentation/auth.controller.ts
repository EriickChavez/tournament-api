import type { Request, Response, NextFunction } from 'express';
import type { RegisterUserUseCase } from '../application/use-cases/register-user.use-case.js';
import type { LoginUserUseCase } from '../application/use-cases/login-user.use-case.js';
import { registerSchema, loginSchema, lookupUserQuerySchema } from './schemas/auth.schemas.js';
import { clearSessionCookie, getSessionIdFromRequest, setSessionCookie } from './utils/session-cookie.js';
import { toPublicUser } from './utils/public-user.js';
import { LogoutUserUseCase } from '../application/use-cases/logout-user.use-case.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { LogoutAllUseCase } from '../application/use-cases/logout-all-use-case.js';
import { GetCurrentUserUseCase } from '../application/use-cases/get-current-user.use-case.js';
import { LookupUserUseCase } from '../application/use-cases/lookup-user.use-case.js';

export class AuthController {
    constructor(
        private readonly registerUseCase: RegisterUserUseCase,
        private readonly loginUseCase: LoginUserUseCase,
        private readonly logoutUseCase: LogoutUserUseCase,
        private readonly logoutAllUseCase: LogoutAllUseCase,
        private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
        private readonly lookupUserUseCase: LookupUserUseCase,

    ) { }

    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const input = registerSchema.parse(req.body);
            const { user, session } = await this.registerUseCase.execute(input);
            setSessionCookie(res, session);
            res.status(201).json({ user: toPublicUser(user) });
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const input = loginSchema.parse(req.body);
            const { user, session } = await this.loginUseCase.execute(input);
            setSessionCookie(res, session);
            res.status(200).json({ user: toPublicUser(user) });
        } catch (error) {
            next(error);
        }
    };
    logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sessionId = getSessionIdFromRequest(req.cookies as Record<string, unknown>);
            if (sessionId) {
                await this.logoutUseCase.execute(sessionId);
            }
            clearSessionCookie(res);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
    logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            await this.logoutAllUseCase.execute(req.userId);
            clearSessionCookie(res);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
    me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const user = await this.getCurrentUserUseCase.execute(req.userId);
            if (!user) {
                throw new AppError(401, 'UNAUTHENTICATED', 'User not found.');
            }
            res.status(200).json({ user: toPublicUser(user) });
        } catch (error) {
            next(error);
        }
    };

    lookup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const { email } = lookupUserQuerySchema.parse(req.query);
            const user = await this.lookupUserUseCase.execute({ email });
            res.status(200).json({ user });
        } catch (error) {
            next(error);
        }
    };
}
