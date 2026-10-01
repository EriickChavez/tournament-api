import { Router } from 'express';
import { PhaseStandingsController } from './phase-standings.controller';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter';

export function createPhaseStandingsRouter(controller: PhaseStandingsController): Router {
    const router = Router({ mergeParams: true });
    // Lectura pública, igual que /phases/:phaseId/groups y /teams.
    router.get('/', publicReadRateLimiter, controller.get);
    return router;
}