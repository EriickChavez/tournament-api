import type { Request, Response, NextFunction } from 'express';
import type { UpsertTournamentBrandingUseCase } from '../application/use-cases/upsert-tournament-branding.use-case.js';
import type { GetTournamentBrandingUseCase } from '../application/use-cases/get-tournament-branding.use-case.js';
import { toPublicBranding } from './utils/public-branding.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { BrandingNotFoundError, FileTooLargeError } from '../domain/errors/branding.errors.js';
import {
    MAX_BANNER_SIZE_BYTES,
    MAX_LOGO_SIZE_BYTES,
    MAX_LOGO_SIZE_MB,
    MAX_BANNER_SIZE_MB,
    brandingParamsSchema,
} from './schemas/branding.schemas.js';

type UploadedFiles = { [fieldname: string]: Express.Multer.File[] } | undefined;

export class BrandingController {
    constructor(
        private readonly upsertTournamentBrandingUseCase: UpsertTournamentBrandingUseCase,
        private readonly getTournamentBrandingUseCase: GetTournamentBrandingUseCase,
    ) { }

    upsert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const { id: tournamentId } = brandingParamsSchema.parse(req.params);
            const files = req.files as UploadedFiles;
            const logoFile = files?.logo?.[0];
            const bannerFile = files?.banner?.[0];

            if (logoFile && logoFile.size > MAX_LOGO_SIZE_BYTES) {
                throw new FileTooLargeError(MAX_LOGO_SIZE_MB);
            }
            if (bannerFile && bannerFile.size > MAX_BANNER_SIZE_BYTES) {
                throw new FileTooLargeError(MAX_BANNER_SIZE_MB);
            }

            const branding = await this.upsertTournamentBrandingUseCase.execute({
                tournamentId,
                userId: req.userId,
                logo: logoFile ? { buffer: logoFile.buffer, mimeType: logoFile.mimetype } : undefined,
                banner: bannerFile
                    ? { buffer: bannerFile.buffer, mimeType: bannerFile.mimetype }
                    : undefined,
            });

            res.status(200).json({ branding: toPublicBranding(branding) });
        } catch (error) {
            next(error);
        }
    };

    getByTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id: tournamentId } = brandingParamsSchema.parse(req.params);
            const branding = await this.getTournamentBrandingUseCase.execute(tournamentId);
            if (!branding) throw new BrandingNotFoundError();
            res.status(200).json({ branding: toPublicBranding(branding) });
        } catch (error) {
            next(error);
        }
    };
}