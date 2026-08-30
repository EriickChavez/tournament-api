import { Router } from 'express';
import type { TournamentController } from './tournament.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createTournamentRouter(
    controller: TournamentController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.post('/', requireAuth, controller.create);
    router.get('/public', publicReadRateLimiter, controller.listPublic);
    router.get('/', requireAuth, controller.listMine);
    router.patch('/:id', requireAuth, controller.update);
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}