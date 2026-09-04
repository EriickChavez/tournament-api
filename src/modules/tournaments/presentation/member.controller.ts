import type { Request, Response, NextFunction } from 'express';
import type { InviteMemberUseCase } from '../application/use-cases/invite-member.use-case.js';
import type { ListMembersUseCase } from '../application/use-cases/list-members.use-case.js';
import type { UpdateMemberRoleUseCase } from '../application/use-cases/update-member-role.use-case.js';
import type { RemoveMemberUseCase } from '../application/use-cases/remove-member.use-case.js';
import { inviteMemberSchema, listMembersQuerySchema } from './schemas/member.schemas.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { buildPaginationMeta } from '../../../shared/utils/pagination.js';

export class MemberController {
    constructor(
        private readonly inviteMemberUseCase: InviteMemberUseCase,
        private readonly listMembersUseCase: ListMembersUseCase,
        private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase,
        private readonly removeMemberUseCase: RemoveMemberUseCase,
    ) { }

    invite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const { userId } = inviteMemberSchema.parse(req.body);
            const member = await this.inviteMemberUseCase.execute({
                tournamentId: req.params.tournamentId as string,
                requesterId: req.userId,
                targetUserId: userId,
            });
            res.status(201).json({ member });
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const pagination = listMembersQuerySchema.parse(req.query);
            const { items, total } = await this.listMembersUseCase.execute({
                tournamentId: req.params.tournamentId as string,
                requesterId: req.userId,
                pagination,
            });
            res.status(200).json({
                members: items,
                pagination: buildPaginationMeta(pagination, total),
            });
        } catch (error) {
            next(error);
        }
    };

    updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const member = await this.updateMemberRoleUseCase.execute({
                tournamentId: req.params.tournamentId as string,
                requesterId: req.userId,
                memberId: req.params.memberId as string,
            });
            res.status(200).json({ member });
        } catch (error) {
            next(error);
        }
    };

    remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            await this.removeMemberUseCase.execute({
                tournamentId: req.params.tournamentId as string,
                requesterId: req.userId,
                memberId: req.params.memberId as string,
            });
            res.status(200).json({ message: 'Member removed successfully' });
        } catch (error) {
            next(error);
        }
    };
}