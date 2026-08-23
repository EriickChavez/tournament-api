import { Router } from 'express';
import type { TournamentController } from './tournament.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';

export function createTournamentRouter(
    controller: TournamentController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.post('/', requireAuth, controller.create);
    return router;
}
