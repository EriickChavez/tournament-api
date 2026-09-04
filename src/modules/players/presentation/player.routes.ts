import { Router } from 'express';
import type { PlayerController } from './player.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createTournamentPlayerRouter(
    controller: PlayerController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    router.get('/', requireAuth, controller.listByTournament);
    router.post('/', requireAuth, controller.create);
    return router;
}

export function createPlayerRouter(
    controller: PlayerController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.patch('/:id', requireAuth, controller.update);
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}

export function createTeamPlayersRouter(controller: PlayerController): Router {
    const router = Router({ mergeParams: true });
    router.get('/', publicReadRateLimiter, controller.listByTeam);
    return router;
}