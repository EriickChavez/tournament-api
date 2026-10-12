import type { Request, Response, NextFunction } from 'express';
import type { CreateMatchEventUseCase } from '../application/use-cases/create-match-event.use-case.js';
import type { DeleteMatchEventUseCase } from '../application/use-cases/delete-match-event.use-case.js';
import type { ListMatchEventsUseCase } from '../application/use-cases/list-match-events.use-case.js';
import type { UpdateMatchEventUseCase } from '../application/use-cases/update-match-event.use-case.js';
import { createMatchEventSchema, updateMatchEventSchema } from './schemas/match-event.schemas.js';
import { toPublicMatchEvent } from './utils/public-match-event.js';
import { AppError } from '../../../shared/errors/app-error.js';

export class MatchEventController {
    constructor(
        private readonly createMatchEventUseCase: CreateMatchEventUseCase,
        private readonly deleteMatchEventUseCase: DeleteMatchEventUseCase,
        private readonly listMatchEventsUseCase: ListMatchEventsUseCase,
        private readonly updateMatchEventUseCase: UpdateMatchEventUseCase,
    ) { }

    listByMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
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
            const { event, duplicated, derivedEvents } = await this.createMatchEventUseCase.execute({
                matchId,
                userId: req.userId,
                eventType: input.eventType,
                minute: input.minute,
                teamId: input.teamId,
                playerId: input.playerId,
                assistedByPlayerId: input.assistedByPlayerId,
                substitutePlayerId: input.substitutePlayerId,
                description: input.description,
                clientEventId: input.clientEventId,
                occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
            });
            // 200 si fue un reintento (mismo clientEventId), 201 si se creó.
            res.status(duplicated ? 200 : 201).json({
                event: toPublicMatchEvent(event),
                derivedEvents: derivedEvents.map(toPublicMatchEvent),
            });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const input = updateMatchEventSchema.parse(req.body);
            const event = await this.updateMatchEventUseCase.execute({
                matchEventId: req.params.id as string,
                userId: req.userId,
                minute: input.minute,
                playerId: input.playerId,
                assistedByPlayerId: input.assistedByPlayerId,
                substitutePlayerId: input.substitutePlayerId,
                description: input.description,
                occurredAt:
                    input.occurredAt === undefined
                        ? undefined
                        : input.occurredAt === null
                            ? null
                            : new Date(input.occurredAt),
            });
            res.status(200).json({ event: toPublicMatchEvent(event) });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const matchEventId = req.params.id as string;
            await this.deleteMatchEventUseCase.execute({ matchEventId, userId: req.userId });
            // 200 también si el evento ya no existía (borrado idempotente).
            res.status(200).json({ message: 'Match event deleted successfully' });
        } catch (error) {
            next(error);
        }
    };
}