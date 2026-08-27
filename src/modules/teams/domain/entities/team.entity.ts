export interface Team {
    id: string;
    tournamentId: string;
    categoryId: string;
    name: string;
    abbreviation: string | null;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}