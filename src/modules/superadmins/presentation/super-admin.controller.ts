import type { Request, Response, NextFunction } from 'express';
import type { RegisterSuperAdminUseCase } from '../application/use-cases/register-super-admin.use-case.js';
import type { LoginSuperAdminUseCase } from '../application/use-cases/login-super-admin.use-case.js';
import type { LogoutSuperAdminUseCase } from '../application/use-cases/logout-super-admin.use-case.js';
import type { LogoutAllSuperAdminUseCase } from '../application/use-cases/logout-all-super-admin.use-case.js';
import type { GetCurrentSuperAdminUseCase } from '../application/use-cases/get-current-super-admin.use-case.js';
import type { ListAllUsersUseCase } from '../application/use-cases/list-all-users.use-case.js';
import type { ListLookupOptionsUseCase } from '../application/use-cases/list-lookup-options.use-case.js';
import type { CreateUserUseCase } from '../application/use-cases/create-user.use-case.js';
import type { UpdateMemberUseCase } from '../application/use-cases/update-member.use-case.js';
import type { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case.js';
import { registerSuperAdminSchema, loginSuperAdminSchema } from './schemas/super-admin.schemas.js';
import { createUserSchema, updateMemberSchema, deleteUserParamsSchema } from './schemas/member.schemas.js';
import {
    clearSuperAdminSessionCookie,
    getSuperAdminSessionIdFromRequest,
    setSuperAdminSessionCookie,
} from './utils/super-admin-session-cookie.js';
import { toPublicSuperAdmin } from './utils/public-super-admin.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { paginationQuerySchema, buildPaginationMeta } from '../../../shared/utils/pagination.js';

export class SuperAdminController {
    constructor(
        private readonly registerUseCase: RegisterSuperAdminUseCase,
        private readonly loginUseCase: LoginSuperAdminUseCase,
        private readonly logoutUseCase: LogoutSuperAdminUseCase,
        private readonly logoutAllUseCase: LogoutAllSuperAdminUseCase,
        private readonly getCurrentSuperAdminUseCase: GetCurrentSuperAdminUseCase,
        private readonly listAllUsersUseCase: ListAllUsersUseCase,
        private readonly listLookupOptionsUseCase: ListLookupOptionsUseCase,
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly updateMemberUseCase: UpdateMemberUseCase,
        private readonly deleteUserUseCase: DeleteUserUseCase,
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

    listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pagination = paginationQuerySchema.parse(req.query);
            const result = await this.listAllUsersUseCase.execute(pagination);
            res.status(200).json({ items: result.items, meta: buildPaginationMeta(pagination, result.total) });
        } catch (error) {
            next(error);
        }
    };

    lookupOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.status(200).json(await this.listLookupOptionsUseCase.execute());
        } catch (error) {
            next(error);
        }
    };

    createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const input = createUserSchema.parse(req.body);
            const user = await this.createUserUseCase.execute(input);
            res.status(201).json({ user });
        } catch (error) {
            next(error);
        }
    };

    updateMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const input = updateMemberSchema.parse(req.body);
            await this.updateMemberUseCase.execute(req.params.memberId as string, input);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId } = deleteUserParamsSchema.parse(req.params);
            const result = await this.deleteUserUseCase.execute(userId);
            res.status(200).json({ deleted: true, tournamentsDeleted: result.tournamentsDeleted });
        } catch (error) {
            next(error);
        }
    };
}