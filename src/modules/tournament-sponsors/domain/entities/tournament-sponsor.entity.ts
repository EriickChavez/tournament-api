export interface TournamentSponsor {
    id: string;
    tournamentId: string;
    name: string;
    description: string;
    logoUrl: string;
    logoStorageKey: string | null;
    websiteUrl: string | null;
    pdfUrl: string | null;
    pdfStorageKey: string | null;
    order: number;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    createdByUserId: string | null;
    createdAt: Date;
    updatedByUserId: string | null;
    updatedAt: Date;
}