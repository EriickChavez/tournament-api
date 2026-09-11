import { Router } from 'express';
import type { AppSponsorController } from './app-sponsor.controller.js';
import { createRequireSuperAuth } from '../../superadmins/presentation/middleware/require-super-auth.middleware.js';
import { publicReadRateLimiter } from '../../../shared/middlewares/rate-limiter.js';
import { uploadAppSponsorFiles } from './middleware/upload.middleware.js';

// GET /sponsors — público, solo isActive + dentro de vigencia
export function createPublicAppSponsorRouter(controller: AppSponsorController): Router {
    const router = Router();
    router.get('/', publicReadRateLimiter, controller.listPublic);
    return router;
}

// /superadmin/app-sponsors — CRUD completo, solo superadmin
export function createAdminAppSponsorRouter(
    controller: AppSponsorController,
    requireSuperAuth: ReturnType<typeof createRequireSuperAuth>,
): Router {
    const router = Router();
    router.get('/', requireSuperAuth, controller.listAdmin);
    router.post('/', requireSuperAuth, uploadAppSponsorFiles, controller.create);
    router.patch('/:id', requireSuperAuth, uploadAppSponsorFiles, controller.update);
    router.delete('/:id', requireSuperAuth, controller.delete);
    return router;
}