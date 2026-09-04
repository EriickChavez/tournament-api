import { Router } from 'express';
import type { MatchController } from './match.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createTournamentMatchRouter(
    controller: MatchController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    router.get('/public', publicReadRateLimiter, controller.listPublicByTournament);
    router.get('/', publicReadRateLimiter, controller.listPublicByTournament);
    router.post('/', requireAuth, controller.create);
    return router;
}

export function createMatchRouter(
    controller: MatchController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    // Detalle público
    router.get('/:id', publicReadRateLimiter, controller.getByIdPublic);
    router.patch('/:id', requireAuth, controller.update);
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}