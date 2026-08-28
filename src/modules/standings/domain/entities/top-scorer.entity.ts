export interface TopScorer {
    id: string;
    tournamentId: string;
    categoryId: string;
    playerId: string;
    goals: number;
    assists: number;
    rank: number | null;
    updatedAt: Date;
}