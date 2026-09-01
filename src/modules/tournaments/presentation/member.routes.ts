import { Router } from 'express';
import type { MemberController } from './member.controller.js';
import { createRequireAuth } from '../../auth/presentation/middleware/require-auth.middleware.js';

export function createMemberRouter(
    controller: MemberController,
    requireAuth: ReturnType<typeof createRequireAuth>,
): Router {
    const router = Router({ mergeParams: true });
    router.post('/', requireAuth, controller.invite);
    router.get('/', requireAuth, controller.list);
    router.patch('/:memberId', requireAuth, controller.updateRole);
    router.delete('/:memberId', requireAuth, controller.remove);
    return router;
}
