export interface TeamStanding {
    id: string;
    tournamentId: string;
    categoryId: string;
    teamId: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    rank: number | null;
    updatedAt: Date;
}