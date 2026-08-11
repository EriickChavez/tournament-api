import { Router } from 'express';
import type { AuthController } from './auth.controller.js';
import { authRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createAuthRouter(controller: AuthController): Router {
    const router = Router();
    router.post('/register', authRateLimiter, controller.register);
    router.post('/login', authRateLimiter, controller.login);
    router.post('/logout', controller.logout);

    return router;
}
