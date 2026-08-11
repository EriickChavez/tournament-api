import type { Response } from 'express';
import type { Session } from '../../domain/entities/session.entity.js';
import { env } from '../../../../config/env.js';

const COOKIE_NAME = 'session_id';

export function setSessionCookie(res: Response, session: Session): void {
    res.cookie(COOKIE_NAME, session.id, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: session.expiresAt,
    });
}

export function clearSessionCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
}

export function getSessionIdFromRequest(cookies: Record<string, unknown>): string | undefined {
    return typeof cookies[COOKIE_NAME] === 'string' ? cookies[COOKIE_NAME] : undefined;
}
