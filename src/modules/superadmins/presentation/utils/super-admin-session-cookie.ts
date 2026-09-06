import type { Response } from 'express';
import type { SuperAdminSession } from '../../domain/entities/super-admin-session.entity.js';
import { env } from '../../../../config/env.js';

const COOKIE_NAME = 'superadmin_session_id';

export function setSuperAdminSessionCookie(res: Response, session: SuperAdminSession): void {
    res.cookie(COOKIE_NAME, session.id, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: session.expiresAt,
    });
}

export function clearSuperAdminSessionCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
}

export function getSuperAdminSessionIdFromRequest(cookies: Record<string, unknown>): string | undefined {
    return typeof cookies[COOKIE_NAME] === 'string' ? cookies[COOKIE_NAME] : undefined;
}