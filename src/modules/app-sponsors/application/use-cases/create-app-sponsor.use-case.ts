import { randomUUID } from 'node:crypto';
import type { AppSponsor } from '../../domain/entities/app-sponsor.entity.js';
import type { AppSponsorRepository } from '../../domain/repositories/app-sponsor.repository.js';
import type { FileStorage } from '../ports/file-storage.port.js';
import {
    AmbiguousLogoInputError,
    AmbiguousPdfInputError,
    InvalidDateRangeError,
    LogoRequiredError,
} from '../../domain/errors/app-sponsor.errors.js';

export class CreateAppSponsorUseCase {
    constructor(
        private readonly appSponsorRepository: AppSponsorRepository,
        private readonly fileStorage: FileStorage,
    ) { }

    async execute(input: {
        name: string;
        description: string;
        logo?: { buffer: Buffer; mimeType: string } | undefined;
        logoUrl?: string | undefined;
        websiteUrl?: string | undefined;
        pdf?: { buffer: Buffer; mimeType: string } | undefined;
        pdfUrl?: string | undefined;
        order?: number | undefined;
        isActive?: boolean | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
        adminId: string;
    }): Promise<AppSponsor> {
        if (!input.logo && !input.logoUrl) {
            throw new LogoRequiredError();
        }
        if (input.logo && input.logoUrl) {
            throw new AmbiguousLogoInputError();
        }
        if (input.pdf && input.pdfUrl) {
            throw new AmbiguousPdfInputError();
        }
        if (input.startDate && input.endDate && input.endDate < input.startDate) {
            throw new InvalidDateRangeError();
        }

        let logoUrl: string;
        let logoStorageKey: string | null;
        if (input.logo) {
            const stored = await this.fileStorage.upload({
                buffer: input.logo.buffer,
                mimeType: input.logo.mimeType,
                key: `logo-${randomUUID()}`,
            });
            logoUrl = stored.url;
            logoStorageKey = stored.key;
        } else {
            // Ya se validó arriba que logoUrl viene definido en este branch.
            logoUrl = input.logoUrl as string;
            logoStorageKey = null;
        }

        let pdfUrl: string | null = null;
        let pdfStorageKey: string | null = null;
        if (input.pdf) {
            const stored = await this.fileStorage.upload({
                buffer: input.pdf.buffer,
                mimeType: input.pdf.mimeType,
                key: `pdf-${randomUUID()}`,
            });
            pdfUrl = stored.url;
            pdfStorageKey = stored.key;
        } else if (input.pdfUrl) {
            pdfUrl = input.pdfUrl;
        }

        return this.appSponsorRepository.create({
            name: input.name,
            description: input.description,
            logoUrl,
            logoStorageKey,
            websiteUrl: input.websiteUrl ?? null,
            pdfUrl,
            pdfStorageKey,
            order: input.order,
            isActive: input.isActive,
            startDate: input.startDate ?? null,
            endDate: input.endDate ?? null,
            createdByAdminId: input.adminId,
        });
    }
}