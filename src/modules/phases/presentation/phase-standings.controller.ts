import type { Request, Response, NextFunction } from 'express';
import type { GetPhaseStandingsUseCase } from '../application/use-cases/get-phase-standings.use-case.js';
import type { GetPhaseClosureUseCase } from '../application/use-cases/get-phase-closure.use-case.js';
import type { SetPhaseManualRanksUseCase } from '../application/use-cases/set-phase-manual-ranks.use-case.js';
import type { ClosePhaseUseCase } from '../application/use-cases/close-phase.use-case.js';
import type { ReopenPhaseUseCase } from '../application/use-cases/reopen-phase.use-case.js';
import type { PhaseManualRank } from '../domain/entities/phase-manual-rank.entity.js';
import type { PhaseClosureDetails } from '../domain/entities/phase-closure.entity.js';
import {
    phaseStandingsQuerySchema,
    setManualRanksSchema,
    closePhaseSchema,
} from './schemas/phase-standings.schemas.js';
import { toPublicPhase, toPublicPhaseGroup } from './utils/public-phase.js';
import { AppError } from '../../../shared/errors/app-error.js';

function toPublicManualRank(item: PhaseManualRank) {
    return { teamId: item.teamId, scope: item.scope, rank: item.rank };
}

function toPublicClosure(details: PhaseClosureDetails) {
    return {
        qualifiersPerGroup: details.closure.qualifiersPerGroup,
        bestNextCount: details.closure.bestNextCount,
        closedAt: details.closure.closedAt.toISOString(),
        qualified: details.qualified.map((q) => ({
            teamId: q.teamId,
            groupId: q.phaseGroupId,
            position: q.position,
            via: q.via,
            points: q.points,
            goalDifference: q.goalDifference,
            goalsFor: q.goalsFor,
        })),
    };
}

export class PhaseStandingsController {
    constructor(
        private readonly getPhaseStandings: GetPhaseStandingsUseCase,
        private readonly getPhaseClosure: GetPhaseClosureUseCase,
        private readonly setPhaseManualRanks: SetPhaseManualRanksUseCase,
        private readonly closePhase: ClosePhaseUseCase,
        private readonly reopenPhase: ReopenPhaseUseCase,
    ) { }

    get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = phaseStandingsQuerySchema.parse(req.query);
            const phaseId = req.params.phaseId as string;
            const [result, closure] = await Promise.all([
                this.getPhaseStandings.execute({
                    phaseId,
                    qualification:
                        query.perGroup !== undefined
                            ? { perGroup: query.perGroup, bestNext: query.bestNext ?? 0 }
                            : undefined,
                }),
                this.getPhaseClosure.execute(phaseId),
            ]);

            res.status(200).json({
                phase: toPublicPhase(result.phase),
                progress: result.progress,
                groups: result.groups.map((g) => ({
                    group: toPublicPhaseGroup(g.group),
                    standings: g.standings,
                })),
                qualification: result.qualification,
                manualRanks: result.manualRanks.map(toPublicManualRank),
                closure: closure ? toPublicClosure(closure) : null,
            });
        } catch (error) {
            next(error);
        }
    };

    setManualRanks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = setManualRanksSchema.parse(req.body);
            const manualRanks = await this.setPhaseManualRanks.execute({
                phaseId: req.params.phaseId as string,
                userId: req.userId,
                scope: body.scope,
                ranks: body.ranks,
            });
            res.status(200).json({ manualRanks: manualRanks.map(toPublicManualRank) });
        } catch (error) {
            next(error);
        }
    };

    close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = closePhaseSchema.parse(req.body);
            const result = await this.closePhase.execute({
                phaseId: req.params.phaseId as string,
                userId: req.userId,
                perGroup: body.perGroup,
                bestNext: body.bestNext ?? 0,
            });
            res.status(200).json({
                phase: toPublicPhase(result.phase),
                closure: toPublicClosure(result.closure),
            });
        } catch (error) {
            next(error);
        }
    };

    reopen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const phase = await this.reopenPhase.execute({
                phaseId: req.params.phaseId as string,
                userId: req.userId,
            });
            res.status(200).json({ phase: toPublicPhase(phase) });
        } catch (error) {
            next(error);
        }
    };
}