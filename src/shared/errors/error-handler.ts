import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';

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

    console.error(error);
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred.',
        },
    });
};