import type { Request, Response, NextFunction } from 'express';
import type { ImportTournamentDataUseCase } from '../application/use-cases/import-tournament-data.use-case.js';
import { importQuerySchema } from './schemas/import.schemas.js';
import { ImportFileRequiredError } from '../domain/errors/import.errors.js';
import { AppError } from '../../../shared/errors/app-error.js';

export class ImportController {
    constructor(private readonly importTournamentDataUseCase: ImportTournamentDataUseCase) { }

    importTournamentData = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            if (!req.file) throw new ImportFileRequiredError();

            const tournamentId = req.params.tournamentId as string;
            const { dryRun } = importQuerySchema.parse(req.query);
            const isDryRun = dryRun === 'true';

            const summary = await this.importTournamentDataUseCase.execute({
                tournamentId,
                userId: req.userId,
                file: req.file.buffer,
                dryRun: isDryRun,
            });

            res.status(isDryRun ? 200 : 201).json({ dryRun: isDryRun, summary });
        } catch (error) {
            next(error);
        }
    };
}