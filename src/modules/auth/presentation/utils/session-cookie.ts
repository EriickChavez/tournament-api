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
