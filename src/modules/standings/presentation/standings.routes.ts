import { Router } from 'express';
import type { StandingsController } from './standings.controller.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createStandingsRouter(controller: StandingsController): Router {
    const router = Router({ mergeParams: true });
    router.get('/standings', publicReadRateLimiter, controller.getStandings);
    router.get('/top-scorers', publicReadRateLimiter, controller.getTopScorers);
    router.get('/cards', publicReadRateLimiter, controller.getCardCounts);
    return router;
}