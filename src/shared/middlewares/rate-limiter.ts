import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many attempts. Please try again later.',
        },
    },
});

/**
 * Para endpoints públicos de solo lectura (sin auth). Más permisivo que
 * authRateLimiter porque un usuario tecleando en un buscador puede disparar
 * varias peticiones por minuto legítimamente; esto solo frena scraping/abuso.
 */
export const publicReadRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests. Please slow down.',
        },
    },
});