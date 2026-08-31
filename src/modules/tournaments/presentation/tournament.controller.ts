import type { Request, Response, NextFunction } from 'express';
import type { CreateTournamentUseCase } from '../application/use-cases/create-tournament.use-case.js';
import type { ListUserTournamentsUseCase } from '../application/use-cases/list-user-tournaments.use-case.js';
import type { ListPublicTournamentsUseCase } from '../application/use-cases/list-public-tournaments.use-case.js';
import type { GetTournamentUseCase } from '../application/use-cases/get-tournament.use-case.js';
import type { UpdateTournamentUseCase } from '../application/use-cases/update-tournament.use-case.js';
import type { DeleteTournamentUseCase } from '../application/use-cases/delete-tournament.use-case.js';
import {
    createTournamentSchema,
    updateTournamentSchema,
    listPublicTournamentsQuerySchema,
} from './schemas/tournament.schemas.js';
import { toPublicTournament, toPublicTournamentWithRole } from './utils/public-tournament.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { buildPaginationMeta } from '../../../shared/utils/pagination.js';

export class TournamentController {
    constructor(
        private readonly createTournamentUseCase: CreateTournamentUseCase,
        private readonly listUserTournamentsUseCase: ListUserTournamentsUseCase,
        private readonly listPublicTournamentsUseCase: ListPublicTournamentsUseCase,
        private readonly getTournamentUseCase: GetTournamentUseCase,
        private readonly updateTournamentUseCase: UpdateTournamentUseCase,
        private readonly deleteTournamentUseCase: DeleteTournamentUseCase,
    ) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const input = createTournamentSchema.parse(req.body);
            const tournament = await this.createTournamentUseCase.execute({
                ...input,
                userId: req.userId,
            });
            res.status(201).json({ tournament: toPublicTournament(tournament) });
        } catch (error) {
            next(error);
        }
    };

    listPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit, search } = listPublicTournamentsQuerySchema.parse(req.query);
            const { items, total } = await this.listPublicTournamentsUseCase.execute(
                { page, limit },
                search,
            );
            res.status(200).json({
                tournaments: items.map(toPublicTournament),
                pagination: buildPaginationMeta({ page, limit }, total),
            });
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
            res.status(200).json({
                tournaments: tournaments.map(toPublicTournamentWithRole),
            });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            const tournament = await this.getTournamentUseCase.execute({
                tournamentId: req.params.id as string,
                userId: req.userId,
            });
            res.status(200).json({ tournament: toPublicTournamentWithRole(tournament) });
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

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            }
            await this.deleteTournamentUseCase.execute({
                tournamentId: req.params.id as string,
                userId: req.userId,
            });
            res.status(200).json({ message: 'Tournament deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}