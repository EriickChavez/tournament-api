export interface Player {
    id: string;
    tournamentId: string;
    categoryId: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    number: number | null;
    teamId: string;
    isCaptain: boolean;
    role: string | null;
    createdAt: Date;
    updatedAt: Date;
}