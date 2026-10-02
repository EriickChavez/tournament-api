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
    phaseId: string | null;
    phaseGroupId: string | null;
    round: number | null;
    homeScore: number | null;
    awayScore: number | null;
    homePenalties: number | null;
    awayPenalties: number | null;
    scheduledAt: Date;
    venue: string | null;
    status: MatchStatus;
    createdByUserId: string | null;
    updatedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}