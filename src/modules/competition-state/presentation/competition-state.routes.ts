import { Router } from 'express';
import type { CompetitionStateController } from './competition-state.controller.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createCompetitionStateRouter(controller: CompetitionStateController): Router {
    // Se monta en /tournaments/:tournamentId. Lectura pública, como el resto de consultas de estado.
    const router = Router({ mergeParams: true });
    router.get('/competition-state', publicReadRateLimiter, controller.get);
    return router;
}