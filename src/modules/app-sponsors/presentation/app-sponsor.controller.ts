import type { NextFunction, Request, Response } from 'express';
import type { ListPublicAppSponsorsUseCase } from '../application/use-cases/list-public-app-sponsors.use-case.js';
import type { ListAllAppSponsorsUseCase } from '../application/use-cases/list-all-app-sponsors.use-case.js';
import type { CreateAppSponsorUseCase } from '../application/use-cases/create-app-sponsor.use-case.js';
import type { UpdateAppSponsorUseCase } from '../application/use-cases/update-app-sponsor.use-case.js';
import type { DeleteAppSponsorUseCase } from '../application/use-cases/delete-app-sponsor.use-case.js';
import {
    appSponsorParamsSchema,
    createAppSponsorSchema,
    MAX_LOGO_SIZE_BYTES,
    MAX_LOGO_SIZE_MB,
    MAX_PDF_SIZE_BYTES,
    MAX_PDF_SIZE_MB,
    updateAppSponsorSchema,
} from './schemas/app-sponsor.schemas.js';
import { toPublicAppSponsor } from './utils/public-app-sponsor.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { FileTooLargeError } from '../domain/errors/app-sponsor.errors.js';

type UploadedFiles = { [fieldname: string]: Express.Multer.File[] } | undefined;

export class AppSponsorController {
    constructor(
        private readonly listPublicAppSponsorsUseCase: ListPublicAppSponsorsUseCase,
        private readonly listAllAppSponsorsUseCase: ListAllAppSponsorsUseCase,
        private readonly createAppSponsorUseCase: CreateAppSponsorUseCase,
        private readonly updateAppSponsorUseCase: UpdateAppSponsorUseCase,
        private readonly deleteAppSponsorUseCase: DeleteAppSponsorUseCase,
    ) { }

    listPublic = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sponsors = await this.listPublicAppSponsorsUseCase.execute();
            res.status(200).json({ sponsors: sponsors.map(toPublicAppSponsor) });
        } catch (error) {
            next(error);
        }
    };

    listAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.superAdminId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No superadmin session found.');
            }
            const sponsors = await this.listAllAppSponsorsUseCase.execute();
            res.status(200).json({ sponsors: sponsors.map(toPublicAppSponsor) });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.superAdminId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No superadmin session found.');
            }

            const files = req.files as UploadedFiles;
            const logoFile = files?.logo?.[0];
            const pdfFile = files?.pdf?.[0];
            if (logoFile && logoFile.size > MAX_LOGO_SIZE_BYTES) {
                throw new FileTooLargeError('logo', MAX_LOGO_SIZE_MB);
            }
            if (pdfFile && pdfFile.size > MAX_PDF_SIZE_BYTES) {
                throw new FileTooLargeError('pdf', MAX_PDF_SIZE_MB);
            }

            const input = createAppSponsorSchema.parse(req.body);
            const sponsor = await this.createAppSponsorUseCase.execute({
                ...input,
                logo: logoFile ? { buffer: logoFile.buffer, mimeType: logoFile.mimetype } : undefined,
                pdf: pdfFile ? { buffer: pdfFile.buffer, mimeType: pdfFile.mimetype } : undefined,
                adminId: req.superAdminId,
            });

            res.status(201).json({ sponsor: toPublicAppSponsor(sponsor) });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.superAdminId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No superadmin session found.');
            }

            const { id } = appSponsorParamsSchema.parse(req.params);
            const files = req.files as UploadedFiles;
            const logoFile = files?.logo?.[0];
            const pdfFile = files?.pdf?.[0];
            if (logoFile && logoFile.size > MAX_LOGO_SIZE_BYTES) {
                throw new FileTooLargeError('logo', MAX_LOGO_SIZE_MB);
            }
            if (pdfFile && pdfFile.size > MAX_PDF_SIZE_BYTES) {
                throw new FileTooLargeError('pdf', MAX_PDF_SIZE_MB);
            }

            const input = updateAppSponsorSchema.parse(req.body);
            const sponsor = await this.updateAppSponsorUseCase.execute({
                id,
                ...input,
                logo: logoFile ? { buffer: logoFile.buffer, mimeType: logoFile.mimetype } : undefined,
                pdf: pdfFile ? { buffer: pdfFile.buffer, mimeType: pdfFile.mimetype } : undefined,
                adminId: req.superAdminId,
            });

            res.status(200).json({ sponsor: toPublicAppSponsor(sponsor) });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.superAdminId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No superadmin session found.');
            }
            const { id } = appSponsorParamsSchema.parse(req.params);
            await this.deleteAppSponsorUseCase.execute(id);
            res.status(200).json({ message: 'App sponsor deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}