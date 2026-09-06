import type { Request, Response, NextFunction } from 'express';
import type { RegisterSuperAdminUseCase } from '../application/use-cases/register-super-admin.use-case.js';
import type { LoginSuperAdminUseCase } from '../application/use-cases/login-super-admin.use-case.js';
import type { LogoutSuperAdminUseCase } from '../application/use-cases/logout-super-admin.use-case.js';
import type { LogoutAllSuperAdminUseCase } from '../application/use-cases/logout-all-super-admin.use-case.js';
import type { GetCurrentSuperAdminUseCase } from '../application/use-cases/get-current-super-admin.use-case.js';
import { registerSuperAdminSchema, loginSuperAdminSchema } from './schemas/super-admin.schemas.js';
import {
    clearSuperAdminSessionCookie,
    getSuperAdminSessionIdFromRequest,
    setSuperAdminSessionCookie,
} from './utils/super-admin-session-cookie.js';
import { toPublicSuperAdmin } from './utils/public-super-admin.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { buildPaginationMeta, paginationQuerySchema } from '../../../shared/utils/pagination.js';
import { ListAllMembersUseCase } from '../application/use-cases/list-all-members.use-case.js';


export class SuperAdminController {
    constructor(
        private readonly registerUseCase: RegisterSuperAdminUseCase,
        private readonly loginUseCase: LoginSuperAdminUseCase,
        private readonly logoutUseCase: LogoutSuperAdminUseCase,
        private readonly logoutAllUseCase: LogoutAllSuperAdminUseCase,
        private readonly getCurrentSuperAdminUseCase: GetCurrentSuperAdminUseCase,
        private readonly listAllMembersUseCase: ListAllMembersUseCase,
    ) { }

    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const input = registerSuperAdminSchema.parse(req.body);
            const superAdmin = await this.registerUseCase.execute(input);
            res.status(201).json({ superAdmin: toPublicSuperAdmin(superAdmin) });
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const input = loginSuperAdminSchema.parse(req.body);
            const { superAdmin, session } = await this.loginUseCase.execute(input);
            setSuperAdminSessionCookie(res, session);
            res.status(200).json({ superAdmin: toPublicSuperAdmin(superAdmin) });
        } catch (error) {
            next(error);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sessionId = getSuperAdminSessionIdFromRequest(req.cookies as Record<string, unknown>);
            if (sessionId) {
                await this.logoutUseCase.execute(sessionId);
            }
            clearSuperAdminSessionCookie(res);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.superAdminId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No superadmin session found.');
            }
            await this.logoutAllUseCase.execute(req.superAdminId);
            clearSuperAdminSessionCookie(res);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.superAdminId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No superadmin session found.');
            }
            const superAdmin = await this.getCurrentSuperAdminUseCase.execute(req.superAdminId);
            if (!superAdmin) {
                throw new AppError(401, 'UNAUTHENTICATED', 'Superadmin not found.');
            }
            res.status(200).json({ superAdmin: toPublicSuperAdmin(superAdmin) });
        } catch (error) {
            next(error);
        }
    };

    listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = paginationQuerySchema.parse(req.query);
            const result = await this.listAllMembersUseCase.execute(pagination);
            res.status(200).json({
                items: result.items,
                meta: buildPaginationMeta(pagination, result.total),
            });
        } catch (error) {
            next(error);
        }
    };
}
