import { Router } from 'express';
import type { TournamentSponsorController } from './tournament-sponsor.controller.js';
import type { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';
import { uploadTournamentSponsorFiles } from './middleware/upload.middleware.js';

export function createTournamentSponsorRouter(
    controller: TournamentSponsorController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });

    // Público: solo activos y vigentes
    router.get('/', publicReadRateLimiter, controller.listPublic);

    // Admin del torneo (OWNER / ADMIN)
    router.get('/admin', requireAuth, controller.listAdmin);
    router.post('/', requireAuth, uploadTournamentSponsorFiles, controller.create);
    router.patch('/:id', requireAuth, uploadTournamentSponsorFiles, controller.update);
    router.delete('/:id', requireAuth, controller.delete);

    return router;
}