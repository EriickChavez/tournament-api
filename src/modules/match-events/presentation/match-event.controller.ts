import type { Request, Response, NextFunction } from 'express';
import type { CreateMatchEventUseCase } from '../application/use-cases/create-match-event.use-case.js';
import type { DeleteMatchEventUseCase } from '../application/use-cases/delete-match-event.use-case.js';
import type { ListMatchEventsUseCase } from '../application/use-cases/list-match-events.use-case.js';
import { createMatchEventSchema } from './schemas/match-event.schemas.js';
import { toPublicMatchEvent } from './utils/public-match-event.js';
import { AppError } from '../../../shared/errors/app-error.js';

export class MatchEventController {
    constructor(
        private readonly createMatchEventUseCase: CreateMatchEventUseCase,
        private readonly deleteMatchEventUseCase: DeleteMatchEventUseCase,
        private readonly listMatchEventsUseCase: ListMatchEventsUseCase,
    ) { }

    listByMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const matchId = req.params.matchId as string;
            const events = await this.listMatchEventsUseCase.execute(matchId);
            res.status(200).json({ events: events.map(toPublicMatchEvent) });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const matchId = req.params.matchId as string;
            const input = createMatchEventSchema.parse(req.body);
            const event = await this.createMatchEventUseCase.execute({ matchId, userId: req.userId, ...input });
            res.status(201).json({ event: toPublicMatchEvent(event) });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const matchEventId = req.params.id as string;
            await this.deleteMatchEventUseCase.execute({ matchEventId, userId: req.userId });
            res.status(200).json({ message: 'Match event deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}
