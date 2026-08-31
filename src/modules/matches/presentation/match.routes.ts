import { Router } from 'express';
import type { MatchController } from './match.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createTournamentMatchRouter(
    controller: MatchController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    // Público primero: calendario de servicio (fans / app), sin auth
    router.get('/public', publicReadRateLimiter, controller.listPublicByTournament);
    router.get('/', requireAuth, controller.listByTournament);
    router.post('/', requireAuth, controller.create);
    return router;
}

export function createMatchRouter(
    controller: MatchController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.patch('/:id', requireAuth, controller.update);
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}