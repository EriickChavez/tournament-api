import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { PhaseStandingsController } from './phase-standings.controller.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createPhaseStandingsRouter(
    controller: PhaseStandingsController,
    requireAuth: RequestHandler,
): Router {
    const router = Router({ mergeParams: true });
    // Lectura pública, igual que /phases/:phaseId/groups y /teams.
    router.get('/', publicReadRateLimiter, controller.get);
    // Decisión manual de empates: solo owner o admin (se valida en el caso de uso).
    router.put('/manual-ranks', requireAuth, controller.setManualRanks);
    return router;
}