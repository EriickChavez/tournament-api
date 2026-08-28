import type { TopScorer } from '../entities/top-scorer.entity.js';

export interface TopScorerRepository {
    findByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<TopScorer[]>;
    upsert(input: {
        tournamentId: string;
        categoryId: string;
        playerId: string;
        goals: number;
        assists: number;
    }): Promise<TopScorer>;
}