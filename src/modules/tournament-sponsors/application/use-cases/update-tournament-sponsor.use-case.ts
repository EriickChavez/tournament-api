import { randomUUID } from 'node:crypto';
import { env } from '../../../../config/env.js';
import type { TournamentSponsor } from '../../domain/entities/tournament-sponsor.entity.js';
import type { TournamentSponsorRepository } from '../../domain/repositories/tournament-sponsor.repository.js';
import type { FileStorage } from '../ports/file-storage.port.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import {
    AmbiguousLogoInputError,
    AmbiguousPdfInputError,
    InvalidDateRangeError,
    TournamentSponsorNotFoundError,
    WebsiteAndPdfConflictError,
} from '../../domain/errors/tournament-sponsor.errors.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';

export class UpdateTournamentSponsorUseCase {
    constructor(
        private readonly sponsorRepository: TournamentSponsorRepository,
        private readonly memberRepository: TournamentMemberRepository,
        private readonly fileStorage: FileStorage,
    ) { }

    async execute(input: {
        id: string;
        tournamentId: string;
        userId: string;
        name?: string | undefined;
        description?: string | undefined;
        logo?: { buffer: Buffer; mimeType: string } | undefined;
        logoUrl?: string | undefined;
        websiteUrl?: string | null | undefined;
        pdf?: { buffer: Buffer; mimeType: string } | undefined;
        pdfUrl?: string | undefined;
        removePdf?: boolean | undefined;
        order?: number | undefined;
        isActive?: boolean | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
    }): Promise<TournamentSponsor> {
        const sponsor = await this.sponsorRepository.findById(input.id);
        if (!sponsor || sponsor.tournamentId !== input.tournamentId) {
            throw new TournamentSponsorNotFoundError();
        }

        const member = await this.memberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        if (input.logo && input.logoUrl) throw new AmbiguousLogoInputError();

        const pdfInputs = [input.pdf, input.pdfUrl, input.removePdf].filter(
            (v) => v !== undefined && v !== false,
        ).length;
        if (pdfInputs > 1) throw new AmbiguousPdfInputError();

        const effectiveStart = input.startDate !== undefined ? input.startDate : sponsor.startDate;
        const effectiveEnd = input.endDate !== undefined ? input.endDate : sponsor.endDate;
        if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
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
                key: `${input.tournamentId}/logo-${randomUUID()}`,
            });
            logoUrl = stored.url;
            logoStorageKey = stored.key;
        } else if (input.logoUrl) {
            logoUrl = input.logoUrl;
            logoStorageKey = null;
        }
        if (logoUrl !== undefined && sponsor.logoStorageKey) {
            await this.fileStorage.delete(sponsor.logoStorageKey).catch(() => undefined);
        }

        let pdfUrl: string | null | undefined;
        let pdfStorageKey: string | null | undefined;
        if (input.pdf) {
            const stored = await this.fileStorage.upload({
                buffer: input.pdf.buffer,
                mimeType: input.pdf.mimeType,
                key: `${input.tournamentId}/pdf-${randomUUID()}`,
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

        return this.sponsorRepository.update(input.id, {
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
            updatedByUserId: input.userId,
        });
    }
}