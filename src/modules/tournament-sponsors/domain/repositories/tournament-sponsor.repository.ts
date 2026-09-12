import type { TournamentSponsor } from '../entities/tournament-sponsor.entity.js';

export interface TournamentSponsorRepository {
    findById(id: string): Promise<TournamentSponsor | null>;
    listByTournament(tournamentId: string): Promise<TournamentSponsor[]>;
    listPublicByTournament(tournamentId: string, now: Date): Promise<TournamentSponsor[]>;
    countByTournament(tournamentId: string): Promise<number>;
    create(input: {
        tournamentId: string;
        name: string;
        description: string;
        logoUrl: string;
        logoStorageKey: string | null;
        websiteUrl?: string | null | undefined;
        pdfUrl?: string | null | undefined;
        pdfStorageKey?: string | null | undefined;
        order?: number | undefined;
        isActive?: boolean | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
        createdByUserId: string;
    }): Promise<TournamentSponsor>;
    update(
        id: string,
        input: {
            name?: string | undefined;
            description?: string | undefined;
            logoUrl?: string | undefined;
            logoStorageKey?: string | null | undefined;
            websiteUrl?: string | null | undefined;
            pdfUrl?: string | null | undefined;
            pdfStorageKey?: string | null | undefined;
            order?: number | undefined;
            isActive?: boolean | undefined;
            startDate?: string | null | undefined;
            endDate?: string | null | undefined;
            updatedByUserId: string;
        },
    ): Promise<TournamentSponsor>;
    delete(id: string): Promise<void>;
}