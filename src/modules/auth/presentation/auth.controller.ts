import type { Request, Response, NextFunction } from 'express';
import type { RegisterUserUseCase } from '../application/use-cases/register-user.use-case.js';
import type { LoginUserUseCase } from '../application/use-cases/login-user.use-case.js';
import { registerSchema, loginSchema } from './schemas/auth.schemas.js';
import { clearSessionCookie, getSessionIdFromRequest, setSessionCookie } from './utils/session-cookie.js';
import { toPublicUser } from './utils/public-user.js';
import { LogoutUserUseCase } from '../application/use-cases/logout-user.use-case.js';

export class AuthController {
    constructor(
        private readonly registerUseCase: RegisterUserUseCase,
        private readonly loginUseCase: LoginUserUseCase,
        private readonly logoutUseCase: LogoutUserUseCase,
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
}
