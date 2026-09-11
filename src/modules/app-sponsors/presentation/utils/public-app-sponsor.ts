import type { AppSponsor } from '../../domain/entities/app-sponsor.entity.js';

export function toPublicAppSponsor(sponsor: AppSponsor) {
    return {
        id: sponsor.id,
        name: sponsor.name,
        description: sponsor.description,
        logoUrl: sponsor.logoUrl,
        websiteUrl: sponsor.websiteUrl,
        pdfUrl: sponsor.pdfUrl,
        order: sponsor.order,
        isActive: sponsor.isActive,
        startDate: sponsor.startDate,
        endDate: sponsor.endDate,
        createdAt: sponsor.createdAt,
        updatedAt: sponsor.updatedAt,
    };
}