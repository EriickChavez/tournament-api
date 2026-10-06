export interface CategoryClosure {
    id: string;
    tournamentId: string;
    categoryId: string;
    /** Campeón al momento de cerrar (null si el equipo se eliminó después). */
    championTeamId: string | null;
    closedByUserId: string | null;
    closedAt: Date;
}