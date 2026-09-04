import { Router } from 'express';
import type { TournamentController } from './tournament.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';
import { isUuid } from '../../../shared/utils/is-uuid.js';

export function createTournamentRouter(
    controller: TournamentController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router();
    router.post('/', requireAuth, controller.create);
    router.get('/public', publicReadRateLimiter, controller.listPublic);
    router.get('/', requireAuth, controller.listMine);

    // Opción A: UUID → auth; slug → público
    router.get('/:id', publicReadRateLimiter, (req, res, next) => {
        const param = req.params.id as string;
        if (isUuid(param)) {
            return requireAuth(req, res, (err?: unknown) => {
                if (err) return next(err);
                return controller.getByParam(req, res, next);
            });
        }
        return controller.getByParam(req, res, next);
    });

    router.patch('/:id', requireAuth, controller.update);
    router.delete('/:id', requireAuth, controller.delete);
    return router;
}