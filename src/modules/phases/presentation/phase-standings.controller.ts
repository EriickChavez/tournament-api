import type { Request, Response, NextFunction } from 'express';
import type { GetPhaseStandingsUseCase } from '../application/use-cases/get-phase-standings.use-case.js';
import { phaseStandingsQuerySchema } from './schemas/phase-standings.schemas.js';
import { toPublicPhase, toPublicPhaseGroup } from './utils/public-phase.js';

export class PhaseStandingsController {
    constructor(private readonly getPhaseStandings: GetPhaseStandingsUseCase) { }

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
            });
        } catch (error) {
            next(error);
        }
    };
}