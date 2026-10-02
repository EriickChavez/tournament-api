import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { PhaseStandingsController } from './phase-standings.controller.js';

export function createPhaseClosureRouter(
    controller: PhaseStandingsController,
    requireAuth: RequestHandler,
): Router {
    const router = Router({ mergeParams: true });
    // Acciones de gestión: solo el owner del torneo (se valida en el caso de uso).
    router.post('/close', requireAuth, controller.close);
    router.post('/reopen', requireAuth, controller.reopen);
    return router;
}