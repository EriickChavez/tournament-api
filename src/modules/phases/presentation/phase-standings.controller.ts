import type { Request, Response, NextFunction } from 'express';
import type { GetPhaseStandingsUseCase } from '../application/use-cases/get-phase-standings.use-case.js';
import type { SetPhaseManualRanksUseCase } from '../application/use-cases/set-phase-manual-ranks.use-case.js';
import type { PhaseManualRank } from '../domain/entities/phase-manual-rank.entity.js';
import {
    phaseStandingsQuerySchema,
    setManualRanksSchema,
} from './schemas/phase-standings.schemas.js';
import { toPublicPhase, toPublicPhaseGroup } from './utils/public-phase.js';
import { AppError } from '../../../shared/errors/app-error.js';

function toPublicManualRank(item: PhaseManualRank) {
    return { teamId: item.teamId, scope: item.scope, rank: item.rank };
}

export class PhaseStandingsController {
    constructor(
        private readonly getPhaseStandings: GetPhaseStandingsUseCase,
        private readonly setPhaseManualRanks: SetPhaseManualRanksUseCase,
    ) { }

    get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = phaseStandingsQuerySchema.parse(req.query);
            const result = await this.getPhaseStandings.execute({
                phaseId: req.params.phaseId as string,
                qualification:
                    query.perGroup !== undefined
                        ? { perGroup: query.perGroup, bestNext: query.bestNext ?? 0 }
                        : undefined,
            });

            res.status(200).json({
                phase: toPublicPhase(result.phase),
                progress: result.progress,
                groups: result.groups.map((g) => ({
                    group: toPublicPhaseGroup(g.group),
                    standings: g.standings,
                })),
                qualification: result.qualification,
                manualRanks: result.manualRanks.map(toPublicManualRank),
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
}