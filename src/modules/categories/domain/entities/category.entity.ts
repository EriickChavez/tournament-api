export interface Category {
    id: string;
    tournamentId: string;
    title: string;
    minAge: number | null;
    maxAge: number | null;
    description: string | null;
    order: number;
    createdByUserId: string | null;
    createdAt: Date;
    updatedByUserId: string | null;
    updatedAt: Date;
}
