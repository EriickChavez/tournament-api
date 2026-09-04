import { Router } from 'express';
import type { TeamController } from './team.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createTournamentTeamRouter(
    controller: TeamController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    router.get('/', publicReadRateLimiter, controller.listByTournament);
    router.post('/', requireAuth, controller.create);
    return router;
}

export function createTeamRouter(
    controller: TeamController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.patch('/:id', requireAuth, controller.update);
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}