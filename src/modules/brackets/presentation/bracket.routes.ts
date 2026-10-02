import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { BracketController } from './bracket.controller.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';

export function createBracketRouter(
    controller: BracketController,
    requireAuth: RequestHandler,
): Router {
    const router = Router({ mergeParams: true });
    // Lectura pública, igual que las demás lecturas de fases.
    router.get('/', publicReadRateLimiter, controller.get);
    // Generar la llave: solo el owner del torneo (se valida en el caso de uso).
    router.post('/generate', requireAuth, controller.generate);
    // Programar el partido de un cruce: owner o admin (lo valida la creación del partido).
    router.post('/nodes/:nodeId/schedule', requireAuth, controller.schedule);
    return router;
}