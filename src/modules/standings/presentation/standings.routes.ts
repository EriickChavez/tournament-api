import { Router } from 'express';
import type { StandingsController } from './standings.controller.js';

export function createStandingsRouter(controller: StandingsController): Router {
    const router = Router({ mergeParams: true });
    router.get('/standings', controller.getStandings);
    router.get('/top-scorers', controller.getTopScorers);
    router.get('/cards', controller.getCardCounts);
    return router;
}
