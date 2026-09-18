import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';

/**
 * Drizzle envuelve el error de pg (DrizzleQueryError) y deja el original en `cause`,
 * así que se busca el SQLSTATE hasta un par de niveles.
 */
function findPgCode(error: unknown): string | undefined {
    let current: unknown = error;
    for (let depth = 0; depth < 3 && typeof current === 'object' && current !== null; depth += 1) {
        const code = (current as { code?: unknown }).code;
        if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
        current = (current as { cause?: unknown }).cause;
    }
    return undefined;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    void _next;

    if (error instanceof ZodError) {
        res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data.',
                details: error.issues,
            },
        });
        return;
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
            },
        });
        return;
    }

    // Errores de express.json(): JSON mal formado o body demasiado grande.
    // Antes caían al 500 genérico.
    const bodyErrorType = (error as { type?: unknown } | null)?.type;
    if (bodyErrorType === 'entity.parse.failed') {
        res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' } });
        return;
    }
    if (bodyErrorType === 'entity.too.large') {
        res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' } });
        return;
    }

    // Errores de Postgres que hoy no se mapean en ningún use case (borrar algo con
    // dependencias, emails/slugs duplicados en carreras, ids con formato inválido).
    const pgCode = findPgCode(error);
    if (pgCode === '23505') {
        res.status(409).json({ error: { code: 'ALREADY_EXISTS', message: 'A record with these values already exists.' } });
        return;
    }
    if (pgCode === '23503') {
        res.status(409).json({
            error: {
                code: 'RELATED_RECORDS_CONFLICT',
                message: 'The operation conflicts with related records (it is referenced by other data or references data that does not exist).',
            },
        });
        return;
    }
    if (pgCode === '22P02') {
        res.status(400).json({ error: { code: 'INVALID_ID', message: 'One of the identifiers has an invalid format.' } });
        return;
    }

    console.error(error);
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred.',
        },
    });
};