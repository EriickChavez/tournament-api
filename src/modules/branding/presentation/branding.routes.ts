import { Router } from 'express';
import type { BrandingController } from './branding.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';
import { uploadBrandingFiles } from './middleware/upload.middleware.js';

export function createBrandingRouter(
    controller: BrandingController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    // mergeParams: true para heredar :id del mount padre
    const router = Router({ mergeParams: true });

    // GET  /tournaments/:id/branding
    // PATCH /tournaments/:id/branding
    router.get('/', publicReadRateLimiter, controller.getByTournament);
    router.patch('/', requireAuth, uploadBrandingFiles, controller.upsert);

    return router;
}