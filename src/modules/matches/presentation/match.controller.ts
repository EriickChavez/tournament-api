import type { Request, Response, NextFunction } from 'express';
import type { CreateMatchUseCase } from '../application/use-cases/create-match.use-case.js';
import type { UpdateMatchUseCase } from '../application/use-cases/update-match.use-case.js';
import type { DeleteMatchUseCase } from '../application/use-cases/delete-match.use-case.js';
import type { ListMatchesUseCase } from '../application/use-cases/list-matches.use-case.js';
import type { GetMatchUseCase } from '../application/use-cases/get-match.use-case.js';
import type { MatchLifecycleUseCase } from '../application/use-cases/match-lifecycle.use-case.js';
import type { MatchRefereesUseCase } from '../application/use-cases/match-referees.use-case.js';
import type { ListMyMatchesUseCase } from '../application/use-cases/list-my-matches.use-case.js';
import {
    createMatchSchema,
    updateMatchSchema,
    listMatchesQuerySchema,
    listMyMatchesQuerySchema,
    setMatchRefereesSchema,
} from './schemas/match.schemas.js';
import { toPublicMatch, toPublicMatchDetails } from './utils/public-match.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { buildPaginationMeta } from '../../../shared/utils/pagination.js';

export class MatchController {
    constructor(
        private readonly createMatchUseCase: CreateMatchUseCase,
        private readonly updateMatchUseCase: UpdateMatchUseCase,
        private readonly deleteMatchUseCase: DeleteMatchUseCase,
        private readonly listMatchesUseCase: ListMatchesUseCase,
        private readonly getMatchUseCase: GetMatchUseCase,
        private readonly matchLifecycleUseCase: MatchLifecycleUseCase,
        private readonly matchRefereesUseCase: MatchRefereesUseCase,
        private readonly listMyMatchesUseCase: ListMyMatchesUseCase,
    ) { }

    listByTournament = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            await this.respondList(req, res);
        } catch (error) {
            next(error);
        }
    };

    listPublicByTournament = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            await this.respondList(req, res);
        } catch (error) {
            next(error);
        }
    };

    /** Partidos asignados al usuario autenticado (app del árbitro). */
    listMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const { page, limit, from, to, ...filters } = listMyMatchesQuerySchema.parse(req.query);
            const { items, total } = await this.listMyMatchesUseCase.execute(
                req.userId,
                { page, limit },
                {
                    ...filters,
                    from: from ? new Date(from) : undefined,
                    to: to ? new Date(to) : undefined,
                },
            );
            res.status(200).json({
                matches: items.map(toPublicMatchDetails),
                pagination: buildPaginationMeta({ page, limit }, total),
            });
        } catch (error) {
            next(error);
        }
    };

    getByIdPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const match = await this.getMatchUseCase.execute({
                matchId: req.params.id as string,
            });
            res.status(200).json({ match: toPublicMatchDetails(match) });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const tournamentId = req.params.tournamentId as string;
            const input = createMatchSchema.parse(req.body);
            const match = await this.createMatchUseCase.execute({
                tournamentId,
                userId: req.userId,
                categoryId: input.categoryId,
                homeTeamId: input.homeTeamId,
                awayTeamId: input.awayTeamId,
                scheduledAt: new Date(input.scheduledAt),
                venue: input.venue,
                status: input.status,
                phaseId: input.phaseId,
                phaseGroupId: input.phaseGroupId,
                round: input.round,
            });
            res.status(201).json({ match: toPublicMatch(match) });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const input = updateMatchSchema.parse(req.body);
            const match = await this.updateMatchUseCase.execute({
                matchId: req.params.id as string,
                userId: req.userId,
                categoryId: input.categoryId,
                homeTeamId: input.homeTeamId,
                awayTeamId: input.awayTeamId,
                scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
                venue: input.venue,
                status: input.status,
                phaseId: input.phaseId,
                phaseGroupId: input.phaseGroupId,
                round: input.round,
                homePenalties: input.homePenalties,
                awayPenalties: input.awayPenalties,
            });
            res.status(200).json({ match: toPublicMatch(match) });
        } catch (error) {
            next(error);
        }
    };

    start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const match = await this.matchLifecycleUseCase.start({
                matchId: req.params.id as string,
                userId: req.userId,
            });
            res.status(200).json({ match: toPublicMatch(match) });
        } catch (error) {
            next(error);
        }
    };

    finish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const match = await this.matchLifecycleUseCase.finish({
                matchId: req.params.id as string,
                userId: req.userId,
            });
            res.status(200).json({ match: toPublicMatch(match) });
        } catch (error) {
            next(error);
        }
    };

    reopen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const match = await this.matchLifecycleUseCase.reopen({
                matchId: req.params.id as string,
                userId: req.userId,
            });
            res.status(200).json({ match: toPublicMatch(match) });
        } catch (error) {
            next(error);
        }
    };

    getReferees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const refereeUserIds = await this.matchRefereesUseCase.list({
                matchId: req.params.id as string,
                userId: req.userId,
            });
            res.status(200).json({ refereeUserIds });
        } catch (error) {
            next(error);
        }
    };

    setReferees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const input = setMatchRefereesSchema.parse(req.body);
            const refereeUserIds = await this.matchRefereesUseCase.set({
                matchId: req.params.id as string,
                userId: req.userId,
                refereeUserIds: input.userIds,
            });
            res.status(200).json({ refereeUserIds });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            await this.deleteMatchUseCase.execute({
                matchId: req.params.id as string,
                userId: req.userId,
            });
            res.status(200).json({ message: 'Match deleted successfully' });
        } catch (error) {
            next(error);
        }
    };

    private async respondList(req: Request, res: Response): Promise<void> {
        const tournamentId = req.params.tournamentId as string;
        const query = listMatchesQuerySchema.parse(req.query);
        const { page, limit, ...filters } = query;
        const { items, total } = await this.listMatchesUseCase.execute(
            tournamentId,
            { page, limit },
            filters,
        );
        res.status(200).json({
            matches: items.map(toPublicMatchDetails),
            pagination: buildPaginationMeta({ page, limit }, total),
        });
    }
}