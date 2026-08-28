export interface CardCount {
    id: string;
    tournamentId: string;
    categoryId: string;
    playerId: string;
    yellowCards: number;
    redCards: number;
    rank: number | null;
    updatedAt: Date;
}