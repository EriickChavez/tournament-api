import { Router } from 'express';
import type { AuthController } from './auth.controller.js';
import { authRateLimiter, publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';
import { createRequireAuth } from './middleware/require-auth.middleware.js';

export function createAuthRouter(
    controller: AuthController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.post('/register', authRateLimiter, controller.register);
    router.post('/login', authRateLimiter, controller.login);
    router.post('/logout', controller.logout);
    router.post('/logout-all', requireAuth, controller.logoutAll);
    router.get('/me', requireAuth, controller.me);

    return router;
}

export function createUserLookupRouter(
    controller: AuthController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.get('/lookup', requireAuth, publicReadRateLimiter, controller.lookup);
    return router;
}