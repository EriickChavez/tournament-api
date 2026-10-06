import type { Request, Response, NextFunction } from 'express';
import type { CloseCategoryUseCase } from '../application/use-cases/close-category.use-case.js';
import type { ReopenCategoryUseCase } from '../application/use-cases/reopen-category.use-case.js';
import type { ListCategoryClosuresUseCase } from '../application/use-cases/list-category-closures.use-case.js';
import type { CategoryClosure } from '../domain/entities/category-closure.entity.js';
import { AppError } from '../../../shared/errors/app-error.js';

function toPublicClosure(closure: CategoryClosure) {
    return {
        categoryId: closure.categoryId,
        championTeamId: closure.championTeamId,
        closedAt: closure.closedAt.toISOString(),
    };
}

export class CategoryClosureController {
    constructor(
        private readonly closeCategory: CloseCategoryUseCase,
        private readonly reopenCategory: ReopenCategoryUseCase,
        private readonly listCategoryClosures: ListCategoryClosuresUseCase,
    ) { }

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const closures = await this.listCategoryClosures.execute(
                req.params.tournamentId as string,
            );
            res.status(200).json({ closures: closures.map(toPublicClosure) });
        } catch (error) {
            next(error);
        }
    };

    close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const closure = await this.closeCategory.execute({
                tournamentId: req.params.tournamentId as string,
                categoryId: req.params.categoryId as string,
                userId: req.userId,
            });
            res.status(201).json({ closure: toPublicClosure(closure) });
        } catch (error) {
            next(error);
        }
    };

    reopen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            await this.reopenCategory.execute({
                tournamentId: req.params.tournamentId as string,
                categoryId: req.params.categoryId as string,
                userId: req.userId,
            });
            res.status(200).json({ message: 'Category championship reopened successfully' });
        } catch (error) {
            next(error);
        }
    };
}