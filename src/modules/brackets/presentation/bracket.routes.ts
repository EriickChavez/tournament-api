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
    // Eliminar la llave (solo si nada ha empezado): owner del torneo.
    router.delete('/', requireAuth, controller.remove);
    // Generar la llave: solo el owner del torneo (se valida en el caso de uso).
    router.post('/generate', requireAuth, controller.generate);
    // Programar el partido de un cruce (ida o vuelta): owner o admin (lo valida la creación del partido).
    router.post('/nodes/:nodeId/schedule', requireAuth, controller.schedule);
    // Penales de un cruce a ida y vuelta cuyo global quedó empatado: owner o admin.
    router.put('/nodes/:nodeId/penalties', requireAuth, controller.setPenalties);
    return router;
}