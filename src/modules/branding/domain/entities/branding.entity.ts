export interface TournamentBranding {
    id: string;
    tournamentId: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    createdByUserId: string | null;
    createdAt: Date;
    updatedByUserId: string | null;
    updatedAt: Date;
}
