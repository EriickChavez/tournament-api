import type { Request, Response, NextFunction } from 'express';
import type { GetCompetitionStateUseCase } from '../application/use-cases/get-competition-state.use-case.js';

export class CompetitionStateController {
    constructor(private readonly getCompetitionState: GetCompetitionStateUseCase) { }

    get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const state = await this.getCompetitionState.execute(
                req.params.tournamentId as string,
            );
            res.status(200).json(state);
        } catch (error) {
            next(error);
        }
    };
}