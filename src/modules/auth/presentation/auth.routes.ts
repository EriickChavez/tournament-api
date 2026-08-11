import { Router } from 'express';
import type { AuthController } from './auth.controller.js';

export function createAuthRouter(controller: AuthController): Router {
    const router = Router();
    router.post('/register', controller.register);
    router.post('/login', controller.login);
    return router;
}
