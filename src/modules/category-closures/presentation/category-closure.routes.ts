import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { CategoryClosureController } from './category-closure.controller.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createCategoryClosureRouter(
    controller: CategoryClosureController,
    requireAuth: RequestHandler,
): Router {
    // Se monta en /tournaments/:tournamentId.
    const router = Router({ mergeParams: true });
    // Lectura pública: qué categorías del torneo están cerradas y quién fue el campeón.
    router.get('/category-closures', publicReadRateLimiter, controller.list);
    // Cerrar / reabrir el campeonato de una categoría: solo el owner (se valida en el caso de uso).
    router.post('/categories/:categoryId/close', requireAuth, controller.close);
    router.post('/categories/:categoryId/reopen', requireAuth, controller.reopen);
    return router;
}