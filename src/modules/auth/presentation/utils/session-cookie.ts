import type { Request, Response } from 'express';
import type { Session } from '../../domain/entities/session.entity.js';
import { env } from '../../../../config/env.js';

const COOKIE_NAME = 'session_id';
const BEARER_PREFIX = 'Bearer ';

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

/**
 * Token de sesión de la petición: `Authorization: Bearer <token>` (apps nativas) o cookie (navegador).
 * El encabezado tiene prioridad; si viene pero es inválido, no se cae a la cookie.
 */
export function extractSessionId(
    req: Request,
): { sessionId: string; source: 'bearer' | 'cookie' } | undefined {
    const header = req.header('authorization');
    if (header && header.startsWith(BEARER_PREFIX)) {
        const token = header.slice(BEARER_PREFIX.length).trim();
        if (token) return { sessionId: token, source: 'bearer' };
    }

    const fromCookie = getSessionIdFromRequest((req.cookies ?? {}) as Record<string, unknown>);
    return fromCookie ? { sessionId: fromCookie, source: 'cookie' } : undefined;
}

/** Las apps nativas piden el token en el cuerpo del login en lugar de una cookie. */
export function isMobileClient(req: Request): boolean {
    return req.header('x-client-type') === 'mobile';
}