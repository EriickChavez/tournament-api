import { Router } from 'express';
import type { ImportController } from './import.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';
import { uploadImportFile } from './middleware/upload.middleware.js';

export function createTournamentImportRouter(
    controller: ImportController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    router.post('/', requireAuth, uploadImportFile, controller.importTournamentData);
    return router;
}