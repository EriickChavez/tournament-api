import type { Request, Response, NextFunction } from 'express';
import type { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case.js';
import type { CreateCategoryUseCase } from '../application/use-cases/create-category.use-case.js';
import type { UpdateCategoryUseCase } from '../application/use-cases/update-category.use-case.js';
import type { DeleteCategoryUseCase } from '../application/use-cases/delete-category.use-case.js';
import { createCategorySchema, updateCategorySchema } from './schemas/category.schemas.js';
import { toPublicCategory } from './utils/public-category.js';
import { AppError } from '../../../shared/errors/app-error.js';

export class CategoryController {
    constructor(
        private readonly listCategoriesUseCase: ListCategoriesUseCase,
        private readonly createCategoryUseCase: CreateCategoryUseCase,
        private readonly updateCategoryUseCase: UpdateCategoryUseCase,
        private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    ) { }

    listByTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const tournamentId = req.params.tournamentId as string;
            const categories = await this.listCategoriesUseCase.execute(tournamentId);
            res.status(200).json({ categories: categories.map(toPublicCategory) });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const tournamentId = req.params.tournamentId as string;
            const input = createCategorySchema.parse(req.body);
            const category = await this.createCategoryUseCase.execute({
                tournamentId,
                userId: req.userId,
                ...input,
            });
            res.status(201).json({ category: toPublicCategory(category) });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const categoryId = req.params.id as string;
            const input = updateCategorySchema.parse(req.body);
            const category = await this.updateCategoryUseCase.execute({
                categoryId,
                userId: req.userId,
                ...input,
            });
            res.status(200).json({ category: toPublicCategory(category) });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const categoryId = req.params.id as string;
            await this.deleteCategoryUseCase.execute({
                categoryId,
                userId: req.userId,
            });
            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}
