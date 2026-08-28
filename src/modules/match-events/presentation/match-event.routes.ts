import { Router } from 'express';
import type { MatchEventController } from './match-event.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';

export function createMatchEventRouter(
    controller: MatchEventController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    router.get('/', requireAuth, controller.listByMatch);
    router.post('/', requireAuth, controller.create);
    return router;
}

export function createStandaloneMatchEventRouter(
    controller: MatchEventController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}