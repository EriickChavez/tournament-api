import { Router } from 'express';
import type { CategoryController } from './category.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createTournamentCategoryRouter(
    controller: CategoryController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    // Lectura pública
    router.get('/', publicReadRateLimiter, controller.listByTournament);
    router.post('/', requireAuth, controller.create);
    return router;
}

export function createCategoryRouter(
    controller: CategoryController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.patch('/:id', requireAuth, controller.update);
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}