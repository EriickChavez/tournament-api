import type { Request, Response, NextFunction } from 'express';
import type { GenerateBracketUseCase } from '../application/use-cases/generate-bracket.use-case.js';
import type { GetBracketUseCase } from '../application/use-cases/get-bracket.use-case.js';
import type { ScheduleBracketMatchUseCase } from '../application/use-cases/schedule-bracket-match.use-case.js';
import type { BracketNode } from '../domain/entities/bracket-node.entity.js';
import { toPublicMatch } from '../../matches/presentation/utils/public-match.js';
import {
    generateBracketSchema,
    scheduleBracketNodeSchema,
} from './schemas/bracket.schemas.js';
import { AppError } from '../../../shared/errors/app-error.js';

function toPublicNode(node: BracketNode) {
    return {
        id: node.id,
        stage: node.stage,
        round: node.round,
        position: node.position,
        homeTeamId: node.homeTeamId,
        awayTeamId: node.awayTeamId,
        homeSeed: node.homeSeed,
        awaySeed: node.awaySeed,
        homeSource: node.homeSourceNodeId
            ? { nodeId: node.homeSourceNodeId, kind: node.homeSourceKind }
            : null,
        awaySource: node.awaySourceNodeId
            ? { nodeId: node.awaySourceNodeId, kind: node.awaySourceKind }
            : null,
        matchId: node.matchId,
        winnerTeamId: node.winnerTeamId,
    };
}

export class BracketController {
    constructor(
        private readonly getBracket: GetBracketUseCase,
        private readonly generateBracket: GenerateBracketUseCase,
        private readonly scheduleBracketMatch: ScheduleBracketMatchUseCase,
    ) { }

    get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const nodes = await this.getBracket.execute(req.params.phaseId as string);
            res.status(200).json({ nodes: nodes.map(toPublicNode) });
        } catch (error) {
            next(error);
        }
    };

    generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = generateBracketSchema.parse(req.body);
            const nodes = await this.generateBracket.execute({
                phaseId: req.params.phaseId as string,
                userId: req.userId,
                sourcePhaseId: body.sourcePhaseId,
                thirdPlace: body.thirdPlace ?? false,
            });
            res.status(201).json({ nodes: nodes.map(toPublicNode) });
        } catch (error) {
            next(error);
        }
    };

    schedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = scheduleBracketNodeSchema.parse(req.body);
            const result = await this.scheduleBracketMatch.execute({
                phaseId: req.params.phaseId as string,
                nodeId: req.params.nodeId as string,
                userId: req.userId,
                scheduledAt: new Date(body.scheduledAt),
                venue: body.venue,
            });
            res.status(201).json({
                node: toPublicNode(result.node),
                match: toPublicMatch(result.match),
            });
        } catch (error) {
            next(error);
        }
    };
}