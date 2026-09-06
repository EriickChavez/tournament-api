import type { Request, Response, NextFunction } from 'express';
import type { SuperAdminSessionRepository } from '../../domain/repositories/super-admin-session.repository.js';
import type { SuperAdminRepository } from '../../domain/repositories/super-admin.repository.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { getSuperAdminSessionIdFromRequest } from '../utils/super-admin-session-cookie.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RENEWAL_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            superAdminId?: string;
        }
    }
}

export function createRequireSuperAuth(
    sessionRepository: SuperAdminSessionRepository,
    superAdminRepository: SuperAdminRepository,
) {
    return async function requireSuperAuth(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const sessionId = getSuperAdminSessionIdFromRequest(req.cookies as Record<string, unknown>);

            if (!sessionId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No superadmin session found.');
            }

            const session = await sessionRepository.findById(sessionId);
            if (!session) {
                throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired superadmin session.');
            }

            const now = Date.now();
            if (session.expiresAt.getTime() < now) {
                await sessionRepository.delete(session.id);
                throw new AppError(401, 'UNAUTHENTICATED', 'Superadmin session expired.');
            }

            const superAdmin = await superAdminRepository.findById(session.superAdminId);
            if (!superAdmin || !superAdmin.isActive) {
                throw new AppError(401, 'UNAUTHENTICATED', 'Superadmin account not accessible.');
            }

            if (session.expiresAt.getTime() - now < RENEWAL_THRESHOLD_MS) {
                const newExpiresAt = new Date(now + SESSION_TTL_MS);
                await sessionRepository.updateExpiresAt(session.id, newExpiresAt);
                res.cookie('superadmin_session_id', session.id, {
                    httpOnly: true,
                    secure: req.secure,
                    sameSite: 'lax',
                    expires: newExpiresAt,
                });
            }

            req.superAdminId = superAdmin.id;
            next();
        } catch (error) {
            next(error);
        }
    };
}