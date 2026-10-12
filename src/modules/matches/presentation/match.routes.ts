import { Router } from 'express';
import type { MatchController } from './match.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createTournamentMatchRouter(
    controller: MatchController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    router.get('/public', publicReadRateLimiter, controller.listPublicByTournament);
    router.get('/', publicReadRateLimiter, controller.listPublicByTournament);
    router.post('/', requireAuth, controller.create);
    return router;
}

export function createMatchRouter(
    controller: MatchController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    // Partidos del árbitro autenticado. Debe ir antes de '/:id' o "mine" se tomaría como un id.
    router.get('/mine', requireAuth, controller.listMine);
    // Detalle público
    router.get('/:id', publicReadRateLimiter, controller.getByIdPublic);
    router.patch('/:id', requireAuth, controller.update);
    // Ciclo de vida de la cédula
    router.post('/:id/start', requireAuth, controller.start);
    router.post('/:id/finish', requireAuth, controller.finish);
    router.post('/:id/reopen', requireAuth, controller.reopen);
    // Árbitros asignados
    router.get('/:id/referees', requireAuth, controller.getReferees);
    router.put('/:id/referees', requireAuth, controller.setReferees);
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}