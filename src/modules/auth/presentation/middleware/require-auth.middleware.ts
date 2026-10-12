import type { Request, Response, NextFunction } from 'express';
import type { SessionRepository } from '../../domain/repositories/session.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { extractSessionId, setSessionCookie } from '../utils/session-cookie.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RENEWAL_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

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
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const found = extractSessionId(req);

            if (!found) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }

            const session = await sessionRepository.findById(found.sessionId);
            if (!session) {
                throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired session.');
            }

            const now = Date.now();
            if (session.expiresAt.getTime() < now) {
                await sessionRepository.delete(session.id);
                throw new AppError(401, 'UNAUTHENTICATED', 'Session expired.');
            }

            const user = await userRepository.findById(session.userId);
            if (!user || !user.isActive) {
                throw new AppError(401, 'UNAUTHENTICATED', 'Account not accessible.');
            }

            if (session.expiresAt.getTime() - now < RENEWAL_THRESHOLD_MS) {
                const newExpiresAt = new Date(now + SESSION_TTL_MS);
                await sessionRepository.updateExpiresAt(session.id, newExpiresAt);
                // Solo el navegador necesita la cookie renovada; la app nativa conserva su token.
                if (found.source === 'cookie') {
                    setSessionCookie(res, { ...session, expiresAt: newExpiresAt });
                }
            }

            req.userId = user.id;
            next();
        } catch (error) {
            next(error);
        }
    };
}