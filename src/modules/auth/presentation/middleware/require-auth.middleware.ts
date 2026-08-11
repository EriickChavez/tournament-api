import type { Request, Response, NextFunction } from 'express';
import type { SessionRepository } from '../../domain/repositories/session.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { AppError } from '../../../../shared/errors/app-error.js';

const COOKIE_NAME = 'session_id';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export function createRequireAuth(
    sessionRepository: SessionRepository,
    userRepository: UserRepository,
) {
    return async function requireAuth(
        req: Request,
        _res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const cookies = req.cookies as Record<string, unknown>;
            const sessionId = typeof cookies[COOKIE_NAME] === 'string' ? cookies[COOKIE_NAME] : undefined;

            if (!sessionId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }

            const session = await sessionRepository.findById(sessionId);
            if (!session) {
                throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired session.');
            }

            if (session.expiresAt.getTime() < Date.now()) {
                await sessionRepository.delete(session.id);
                throw new AppError(401, 'UNAUTHENTICATED', 'Session expired.');
            }

            const user = await userRepository.findById(session.userId);
            if (!user || user.status === 'SUSPENDED') {
                throw new AppError(401, 'UNAUTHENTICATED', 'Account not accessible.');
            }

            req.userId = user.id;
            next();
        } catch (error) {
            next(error);
        }
    };
}