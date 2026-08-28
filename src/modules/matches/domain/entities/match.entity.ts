export type MatchStatus =
    | 'scheduled'
    | 'in_progress'
    | 'finished'
    | 'cancelled'
    | 'postponed';

export interface Match {
    id: string;
    tournamentId: string;
    categoryId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: Date;
    venue: string | null;
    status: MatchStatus;
    createdByUserId: string | null;
    updatedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
