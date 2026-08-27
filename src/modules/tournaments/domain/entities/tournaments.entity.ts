export interface Tournament {
    id: string;
    name: string;
    subtitle: string | null;
    description: string | null;
    slug: string;
    startDate: string | null;
    endDate: string | null;
    timezone: string;
    createdByUserId: string | null;
    createdAt: Date;
    updatedByUserId: string | null;
    updatedAt: Date;
}