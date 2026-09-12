import { randomUUID } from 'node:crypto';
import type { AppSponsor } from '../../domain/entities/app-sponsor.entity.js';
import type { AppSponsorRepository } from '../../domain/repositories/app-sponsor.repository.js';
import type { FileStorage } from '../ports/file-storage.port.js';
import {
    AmbiguousLogoInputError,
    AmbiguousPdfInputError,
    AppSponsorNotFoundError,
    InvalidDateRangeError,
    WebsiteAndPdfConflictError,
} from '../../domain/errors/app-sponsor.errors.js';

export class UpdateAppSponsorUseCase {
    constructor(
        private readonly appSponsorRepository: AppSponsorRepository,
        private readonly fileStorage: FileStorage,
    ) { }

    async execute(input: {
        id: string;
        adminId: string;
        name?: string | undefined;
        description?: string | undefined;
        logo?: { buffer: Buffer; mimeType: string } | undefined;
        logoUrl?: string | undefined;
        websiteUrl?: string | null | undefined;
        pdf?: { buffer: Buffer; mimeType: string } | undefined;
        pdfUrl?: string | undefined;
        /** Borra el pdf existente. Excluyente con `pdf`/`pdfUrl`. */
        removePdf?: boolean | undefined;
        order?: number | undefined;
        isActive?: boolean | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
    }): Promise<AppSponsor> {
        const sponsor = await this.appSponsorRepository.findById(input.id);
        if (!sponsor) throw new AppSponsorNotFoundError();

        if (input.logo && input.logoUrl) {
            throw new AmbiguousLogoInputError();
        }

        const pdfInputsProvided = [input.pdf, input.pdfUrl, input.removePdf].filter(
            (value) => value !== undefined && value !== false,
        ).length;
        if (pdfInputsProvided > 1) {
            throw new AmbiguousPdfInputError();
        }

        const effectiveStartDate = input.startDate !== undefined ? input.startDate : sponsor.startDate;
        const effectiveEndDate = input.endDate !== undefined ? input.endDate : sponsor.endDate;
        if (effectiveStartDate && effectiveEndDate && effectiveEndDate < effectiveStartDate) {
            throw new InvalidDateRangeError();
        }

        // Validado ANTES de tocar storage: si esto revienta después de subir/borrar
        // archivos, el sponsor queda con una referencia rota a un archivo ya borrado.
        const effectiveWebsiteUrl =
            input.websiteUrl !== undefined ? input.websiteUrl : sponsor.websiteUrl;
        const willHavePdf =
            input.pdf !== undefined || input.pdfUrl !== undefined
                ? true
                : input.removePdf
                    ? false
                    : sponsor.pdfUrl !== null;
        if (effectiveWebsiteUrl && willHavePdf) {
            throw new WebsiteAndPdfConflictError();
        }

        let logoUrl: string | undefined;
        let logoStorageKey: string | null | undefined;
        if (input.logo) {
            const stored = await this.fileStorage.upload({
                buffer: input.logo.buffer,
                mimeType: input.logo.mimeType,
                key: `logo-${randomUUID()}`,
            });
            logoUrl = stored.url;
            logoStorageKey = stored.key;
        } else if (input.logoUrl) {
            logoUrl = input.logoUrl;
            logoStorageKey = null;
        }
        if (logoUrl !== undefined && sponsor.logoStorageKey) {
            // Se reemplazó el logo — el archivo viejo (si era nuestro, no una
            // URL externa) ya no tiene referencia en la fila y se borra del
            // storage. Un fallo al borrar no debe tumbar la actualización.
            await this.fileStorage.delete(sponsor.logoStorageKey).catch(() => undefined);
        }

        let pdfUrl: string | null | undefined;
        let pdfStorageKey: string | null | undefined;
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
            pdfStorageKey = null;
        } else if (input.removePdf) {
            pdfUrl = null;
            pdfStorageKey = null;
        }
        if (pdfUrl !== undefined && sponsor.pdfStorageKey) {
            await this.fileStorage.delete(sponsor.pdfStorageKey).catch(() => undefined);
        }

        return this.appSponsorRepository.update(input.id, {
            name: input.name,
            description: input.description,
            logoUrl,
            logoStorageKey,
            websiteUrl: input.websiteUrl,
            pdfUrl,
            pdfStorageKey,
            order: input.order,
            isActive: input.isActive,
            startDate: input.startDate,
            endDate: input.endDate,
            updatedByAdminId: input.adminId,
        });
    }
}