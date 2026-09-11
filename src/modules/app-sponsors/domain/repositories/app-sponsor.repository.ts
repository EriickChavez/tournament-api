import type { AppSponsor } from '../entities/app-sponsor.entity.js';

export interface AppSponsorRepository {
    findById(id: string): Promise<AppSponsor | null>;

    /** Todos los sponsors, sin filtrar por isActive/vigencia — uso admin. */
    listAll(): Promise<AppSponsor[]>;

    /** Solo isActive=true y dentro de vigencia a `now` — uso público. */
    listPublic(now: Date): Promise<AppSponsor[]>;

    create(input: {
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
        createdByAdminId: string;
    }): Promise<AppSponsor>;

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
            updatedByAdminId: string;
        },
    ): Promise<AppSponsor>;

    delete(id: string): Promise<void>;
}