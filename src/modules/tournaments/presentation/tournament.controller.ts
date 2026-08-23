import type { Request, Response, NextFunction } from 'express';
import type { CreateTournamentUseCase } from '../application/use-cases/create-tournament.use-case.js';
import { createTournamentSchema } from './schemas/tournament.schemas.js';
import { toPublicTournament } from './utils/public-tournament.js';
import { AppError } from '../../../shared/errors/app-error.js';

export class TournamentController {
    constructor(private readonly createTournamentUseCase: CreateTournamentUseCase) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const input = createTournamentSchema.parse(req.body);
            const tournament = await this.createTournamentUseCase.execute({ ...input, userId: req.userId });
            res.status(201).json({ tournament: toPublicTournament(tournament) });
        } catch (error) {
            next(error);
        }
    };
}
