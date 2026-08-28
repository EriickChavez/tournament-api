import type { Request, Response, NextFunction } from 'express';
import type { TeamStandingRepository } from '../domain/repositories/team-standing.repository.js';
import type { TopScorerRepository } from '../domain/repositories/top-scorer.repository.js';
import type { CardCountRepository } from '../domain/repositories/card-count.repository.js';
import { toPublicTeamStanding, toPublicTopScorer, toPublicCardCount } from './utils/public-standings.js';

export class StandingsController {
    constructor(
        private readonly teamStandingRepository: TeamStandingRepository,
        private readonly topScorerRepository: TopScorerRepository,
        private readonly cardCountRepository: CardCountRepository,
    ) { }

    getStandings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tournamentId = req.params.tournamentId as string;
            const categoryId = req.params.categoryId as string;
            const standings = await this.teamStandingRepository.findByTournamentAndCategory(tournamentId, categoryId);
            res.status(200).json({ standings: standings.map(toPublicTeamStanding) });
        } catch (error) {
            next(error);
        }
    };

    getTopScorers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tournamentId = req.params.tournamentId as string;
            const categoryId = req.params.categoryId as string;
            const scorers = await this.topScorerRepository.findByTournamentAndCategory(tournamentId, categoryId);
            res.status(200).json({ topScorers: scorers.map(toPublicTopScorer) });
        } catch (error) {
            next(error);
        }
    };

    getCardCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tournamentId = req.params.tournamentId as string;
            const categoryId = req.params.categoryId as string;
            const cards = await this.cardCountRepository.findByTournamentAndCategory(tournamentId, categoryId);
            res.status(200).json({ cards: cards.map(toPublicCardCount) });
        } catch (error) {
            next(error);
        }
    };
}