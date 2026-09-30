export interface ImportPlan {
    tournamentId: string;
    userId: string;
    /** Solo equipos nuevos; los que ya existen no se modifican. */
    teams: {
        id: string;
        categoryId: string;
        name: string;
        abbreviation: string | null;
        logoUrl: string | null;
    }[];
    /** Solo jugadores nuevos, ligados a un equipo nuevo o ya existente. */
    players: {
        id: string;
        categoryId: string;
        teamId: string;
        firstName: string;
        lastName: string;
        birthDate: string | null;
        number: number;
        isCaptain: boolean;
        role: string | null;
    }[];
}

export interface ImportSummary {
    teamsCreated: number;
    teamsExisting: number;
    playersCreated: number;
    playersSkipped: number;
}