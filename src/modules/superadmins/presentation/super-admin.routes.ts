import { Router } from 'express';
import type { SuperAdminController } from './super-admin.controller.js';
import { authRateLimiter } from '../../../shared/middlewares/rate-limiter.js';
import { createRequireSuperAuth } from './middleware/require-super-auth.middleware.js';

export function createSuperAdminRouter(
    controller: SuperAdminController,
    requireSuperAuth: ReturnType<typeof createRequireSuperAuth>,
): Router {
    const router = Router();
    router.post('/register', requireSuperAuth, controller.register);
    router.post('/login', authRateLimiter, controller.login);
    router.post('/logout', controller.logout);
    router.post('/logout-all', requireSuperAuth, controller.logoutAll);
    router.get('/me', requireSuperAuth, controller.me);
    router.get('/members', requireSuperAuth, controller.listMembers);

    return router;
}