import type { CardCount } from '../entities/card-count.entity.js';

export interface CardCountRepository {
    findByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<CardCount[]>;
    upsert(input: {
        tournamentId: string;
        categoryId: string;
        playerId: string;
        yellowCards: number;
        redCards: number;
    }): Promise<CardCount>;
}