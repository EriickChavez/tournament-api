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
    router.get('/users', requireSuperAuth, controller.listUsers);
    router.get('/lookup-options', requireSuperAuth, controller.lookupOptions);
    router.post('/users', requireSuperAuth, controller.createUser);
    router.patch('/members/:memberId', requireSuperAuth, controller.updateMember);
    router.delete('/users/:userId', requireSuperAuth, controller.deleteUser);

    router.patch(
        '/tournaments/:id/max-sponsors',
        requireSuperAuth,
        controller.updateTournamentMaxSponsors,
    );
    router.get('/tournaments', requireSuperAuth, controller.listTournaments);

    return router;
}