import type { Request, Response, NextFunction } from 'express';
import type { CreatePlayerUseCase } from '../application/use-cases/create-player.use-case.js';
import type { UpdatePlayerUseCase } from '../application/use-cases/update-player.use-case.js';
import type { DeletePlayerUseCase } from '../application/use-cases/delete-player.use-case.js';
import type { ListPlayersUseCase } from '../application/use-cases/list-players.use-case.js';
import type { ListPlayersByTeamUseCase } from '../application/use-cases/list-players-by-team.use-case.js';
import { createPlayerSchema, updatePlayerSchema } from './schemas/player.schemas.js';
import { toPublicPlayer } from './utils/public-player.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { paginationQuerySchema, buildPaginationMeta } from '../../../shared/utils/pagination.js';

export class PlayerController {
    constructor(
        private readonly createPlayerUseCase: CreatePlayerUseCase,
        private readonly updatePlayerUseCase: UpdatePlayerUseCase,
        private readonly deletePlayerUseCase: DeletePlayerUseCase,
        private readonly listPlayersUseCase: ListPlayersUseCase,
        private readonly listPlayersByTeamUseCase: ListPlayersByTeamUseCase,
    ) { }

    listByTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const tournamentId = req.params.tournamentId as string;
            const pagination = paginationQuerySchema.parse(req.query);
            const { items, total } = await this.listPlayersUseCase.execute(tournamentId, pagination);
            res.status(200).json({
                players: items.map(toPublicPlayer),
                pagination: buildPaginationMeta(pagination, total),
            });
        } catch (error) {
            next(error);
        }
    };


    listByTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const teamId = req.params.teamId as string;
            const pagination = paginationQuerySchema.parse(req.query);
            const { items, total } = await this.listPlayersByTeamUseCase.execute(teamId, pagination);
            res.status(200).json({
                players: items.map(toPublicPlayer),
                pagination: buildPaginationMeta(pagination, total),
            });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const tournamentId = req.params.tournamentId as string;
            const input = createPlayerSchema.parse(req.body);
            const player = await this.createPlayerUseCase.execute({
                tournamentId,
                userId: req.userId,
                ...input,
            });
            res.status(201).json({ player: toPublicPlayer(player) });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const playerId = req.params.id as string;
            const input = updatePlayerSchema.parse(req.body);
            const player = await this.updatePlayerUseCase.execute({
                playerId,
                userId: req.userId,
                ...input,
            });
            res.status(200).json({ player: toPublicPlayer(player) });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const playerId = req.params.id as string;
            await this.deletePlayerUseCase.execute({ playerId, userId: req.userId });
            res.status(200).json({ message: 'Player deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}