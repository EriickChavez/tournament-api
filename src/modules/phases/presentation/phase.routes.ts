import { Router } from 'express';
import type { PhaseController } from './phase.controller.js';
import type { RequestHandler } from 'express';

export function createPhaseRoutes(
    controller: PhaseController,
    requireAuth: RequestHandler,
): {
    tournamentCategoryPhaseRouter: Router;
    phaseRouter: Router;
    phaseGroupRouter: Router;
} {
    const tournamentCategoryPhaseRouter = Router({ mergeParams: true });
    const phaseRouter = Router();
    const phaseGroupRouter = Router();

    // Nested under /tournaments/:tournamentId/categories/:categoryId/phases
    tournamentCategoryPhaseRouter.get('/', controller.list);
    tournamentCategoryPhaseRouter.post('/', requireAuth, controller.create);

    // /phases/:id
    phaseRouter.get('/:id', controller.get);
    phaseRouter.patch('/:id', requireAuth, controller.update);
    phaseRouter.delete('/:id', requireAuth, controller.remove);

    // Groups under /phases/:phaseId/groups
    phaseRouter.post('/:phaseId/groups', requireAuth, controller.createGroup);
    phaseRouter.get('/:phaseId/groups', controller.listGroups);

    // Teams under /phases/:phaseId/teams
    phaseRouter.put('/:phaseId/teams', requireAuth, controller.syncTeams);
    phaseRouter.get('/:phaseId/teams', controller.listTeams);

    // Standalone group mutations /phase-groups/:id
    phaseGroupRouter.patch('/:id', requireAuth, controller.updateGroup);
    phaseGroupRouter.delete('/:id', requireAuth, controller.removeGroup);

    return {
        tournamentCategoryPhaseRouter,
        phaseRouter,
        phaseGroupRouter,
    };
}