import type { Request, Response, NextFunction } from 'express';
import type { RegisterUserUseCase } from '../application/use-cases/register-user.use-case.js';
import type { LoginUserUseCase } from '../application/use-cases/login-user.use-case.js';
import { registerSchema, loginSchema } from './schemas/auth.schemas.js';
import { setSessionCookie } from './utils/session-cookie.js';
import { toPublicUser } from './utils/public-user.js';

export class AuthController {
    constructor(
        private readonly registerUseCase: RegisterUserUseCase,
        private readonly loginUseCase: LoginUserUseCase,
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
}
