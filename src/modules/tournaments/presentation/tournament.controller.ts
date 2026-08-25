import type { Request, Response, NextFunction } from 'express';
import type { CreateTournamentUseCase } from '../application/use-cases/create-tournament.use-case.js';
import type { ListUserTournamentsUseCase } from '../application/use-cases/list-user-tournaments.use-case.js';
import type { UpdateTournamentUseCase } from '../application/use-cases/update-tournament.use-case.js';
import { createTournamentSchema, updateTournamentSchema } from './schemas/tournament.schemas.js';
import { toPublicTournament, toPublicTournamentWithRole } from './utils/public-tournament.js';
import { AppError } from '../../../shared/errors/app-error.js';

export class TournamentController {
    constructor(
        private readonly createTournamentUseCase: CreateTournamentUseCase,
        private readonly listUserTournamentsUseCase: ListUserTournamentsUseCase,
        private readonly updateTournamentUseCase: UpdateTournamentUseCase,
    ) { }

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

    listMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const tournaments = await this.listUserTournamentsUseCase.execute(req.userId);
            res.status(200).json({ tournaments: tournaments.map(toPublicTournamentWithRole) });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const input = updateTournamentSchema.parse(req.body);
            const tournament = await this.updateTournamentUseCase.execute({
                tournamentId: req.params.id as string,
                userId: req.userId,
                ...input,
            });
            res.status(200).json({ tournament: toPublicTournament(tournament) });
        } catch (error) {
            next(error);
        }
    };
}