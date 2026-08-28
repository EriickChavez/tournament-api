import type { Request, Response, NextFunction } from 'express';
import type { CreateTeamUseCase } from '../application/use-cases/create-team.use-case.js';
import type { UpdateTeamUseCase } from '../application/use-cases/update-team.use-case.js';
import type { DeleteTeamUseCase } from '../application/use-cases/delete-team.use-case.js';
import type { ListTeamsUseCase } from '../application/use-cases/list-teams.use-case.js';
import { createTeamSchema, updateTeamSchema } from './schemas/team.schemas.js';
import { toPublicTeam } from './utils/public-team.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { paginationQuerySchema, buildPaginationMeta } from '../../../shared/utils/pagination.js';


export class TeamController {
    constructor(
        private readonly createTeamUseCase: CreateTeamUseCase,
        private readonly updateTeamUseCase: UpdateTeamUseCase,
        private readonly deleteTeamUseCase: DeleteTeamUseCase,
        private readonly listTeamsUseCase: ListTeamsUseCase,
    ) { }

    listByTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const tournamentId = req.params.tournamentId as string;
            const pagination = paginationQuerySchema.parse(req.query);
            const { items, total } = await this.listTeamsUseCase.execute(tournamentId, pagination);
            res.status(200).json({
                teams: items.map(toPublicTeam),
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
            const input = createTeamSchema.parse(req.body);
            const team = await this.createTeamUseCase.execute({ tournamentId, userId: req.userId, ...input });
            res.status(201).json({ team: toPublicTeam(team) });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const teamId = req.params.id as string;
            const input = updateTeamSchema.parse(req.body);
            const team = await this.updateTeamUseCase.execute({ teamId, userId: req.userId, ...input });
            res.status(200).json({ team: toPublicTeam(team) });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const teamId = req.params.id as string;
            await this.deleteTeamUseCase.execute({ teamId, userId: req.userId });
            res.status(200).json({ message: 'Team deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}