import type { NextFunction, Request, Response } from 'express';
import type { ListPublicTournamentSponsorsUseCase } from '../application/use-cases/list-public-tournament-sponsors.use-case.js';
import type { ListAdminTournamentSponsorsUseCase } from '../application/use-cases/list-admin-tournament-sponsors.use-case.js';
import type { CreateTournamentSponsorUseCase } from '../application/use-cases/create-tournament-sponsor.use-case.js';
import type { UpdateTournamentSponsorUseCase } from '../application/use-cases/update-tournament-sponsor.use-case.js';
import type { DeleteTournamentSponsorUseCase } from '../application/use-cases/delete-tournament-sponsor.use-case.js';
import {
    createTournamentSponsorSchema,
    MAX_LOGO_SIZE_BYTES,
    MAX_LOGO_SIZE_MB,
    MAX_PDF_SIZE_BYTES,
    MAX_PDF_SIZE_MB,
    tournamentSponsorParamsSchema,
    updateTournamentSponsorSchema,
} from './schemas/tournament-sponsor.schemas.js';
import { toPublicTournamentSponsor } from './utils/public-tournament-sponsor.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { FileTooLargeError } from '../domain/errors/tournament-sponsor.errors.js';

type UploadedFiles = { [fieldname: string]: Express.Multer.File[] } | undefined;

export class TournamentSponsorController {
    constructor(
        private readonly listPublicUseCase: ListPublicTournamentSponsorsUseCase,
        private readonly listAdminUseCase: ListAdminTournamentSponsorsUseCase,
        private readonly createUseCase: CreateTournamentSponsorUseCase,
        private readonly updateUseCase: UpdateTournamentSponsorUseCase,
        private readonly deleteUseCase: DeleteTournamentSponsorUseCase,
    ) { }

    listPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tournamentId } = tournamentSponsorParamsSchema.parse(req.params);
            const sponsors = await this.listPublicUseCase.execute(tournamentId);
            res.status(200).json({ sponsors: sponsors.map(toPublicTournamentSponsor) });
        } catch (error) {
            next(error);
        }
    };

    listAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const { tournamentId } = tournamentSponsorParamsSchema.parse(req.params);
            const sponsors = await this.listAdminUseCase.execute({
                tournamentId,
                userId: req.userId,
            });
            res.status(200).json({ sponsors: sponsors.map(toPublicTournamentSponsor) });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }

            const { tournamentId } = tournamentSponsorParamsSchema.parse(req.params);
            const files = req.files as UploadedFiles;
            const logoFile = files?.logo?.[0];
            const pdfFile = files?.pdf?.[0];

            if (logoFile && logoFile.size > MAX_LOGO_SIZE_BYTES) {
                throw new FileTooLargeError('logo', MAX_LOGO_SIZE_MB);
            }
            if (pdfFile && pdfFile.size > MAX_PDF_SIZE_BYTES) {
                throw new FileTooLargeError('pdf', MAX_PDF_SIZE_MB);
            }

            const input = createTournamentSponsorSchema.parse(req.body);
            const sponsor = await this.createUseCase.execute({
                tournamentId,
                userId: req.userId,
                ...input,
                logo: logoFile ? { buffer: logoFile.buffer, mimeType: logoFile.mimetype } : undefined,
                pdf: pdfFile ? { buffer: pdfFile.buffer, mimeType: pdfFile.mimetype } : undefined,
            });

            res.status(201).json({ sponsor: toPublicTournamentSponsor(sponsor) });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }

            const params = tournamentSponsorParamsSchema.parse(req.params);
            if (!params.id) {
                throw new AppError(400, 'VALIDATION_ERROR', 'Sponsor id is required.');
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

            const input = updateTournamentSponsorSchema.parse(req.body);
            const sponsor = await this.updateUseCase.execute({
                id: params.id,
                tournamentId: params.tournamentId,
                userId: req.userId,
                ...input,
                logo: logoFile ? { buffer: logoFile.buffer, mimeType: logoFile.mimetype } : undefined,
                pdf: pdfFile ? { buffer: pdfFile.buffer, mimeType: pdfFile.mimetype } : undefined,
            });

            res.status(200).json({ sponsor: toPublicTournamentSponsor(sponsor) });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }

            const params = tournamentSponsorParamsSchema.parse(req.params);
            if (!params.id) {
                throw new AppError(400, 'VALIDATION_ERROR', 'Sponsor id is required.');
            }

            await this.deleteUseCase.execute({
                id: params.id,
                tournamentId: params.tournamentId,
                userId: req.userId,
            });

            res.status(200).json({ message: 'Tournament sponsor deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}