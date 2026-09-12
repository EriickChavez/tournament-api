import { randomUUID } from 'node:crypto';
import { env } from '../../../../config/env.js';
import type { TournamentSponsor } from '../../domain/entities/tournament-sponsor.entity.js';
import type { TournamentSponsorRepository } from '../../domain/repositories/tournament-sponsor.repository.js';
import type { FileStorage } from '../ports/file-storage.port.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import { TournamentNotFoundError } from '../../../tournaments/domain/errors/tournaments.errors.js';
import {
    AmbiguousLogoInputError,
    AmbiguousPdfInputError,
    InvalidDateRangeError,
    LogoRequiredError,
    NotTournamentAdminError,
    SponsorLimitReachedError,
} from '../../domain/errors/tournament-sponsor.errors.js';

export class CreateTournamentSponsorUseCase {
    constructor(
        private readonly sponsorRepository: TournamentSponsorRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly memberRepository: TournamentMemberRepository,
        private readonly fileStorage: FileStorage,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
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
    }): Promise<TournamentSponsor> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.memberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (
            !member ||
            (member.roleId !== env.OWNER_ROLE_ID && member.roleId !== env.ADMIN_ROLE_ID)
        ) {
            throw new NotTournamentAdminError();
        }

        const currentCount = await this.sponsorRepository.countByTournament(input.tournamentId);
        if (currentCount >= tournament.maxSponsors) {
            throw new SponsorLimitReachedError(tournament.maxSponsors);
        }

        if (!input.logo && !input.logoUrl) throw new LogoRequiredError();
        if (input.logo && input.logoUrl) throw new AmbiguousLogoInputError();
        if (input.pdf && input.pdfUrl) throw new AmbiguousPdfInputError();
        if (input.startDate && input.endDate && input.endDate < input.startDate) {
            throw new InvalidDateRangeError();
        }

        let logoUrl: string;
        let logoStorageKey: string | null;
        if (input.logo) {
            const stored = await this.fileStorage.upload({
                buffer: input.logo.buffer,
                mimeType: input.logo.mimeType,
                key: `${input.tournamentId}/logo-${randomUUID()}`,
            });
            logoUrl = stored.url;
            logoStorageKey = stored.key;
        } else {
            logoUrl = input.logoUrl as string;
            logoStorageKey = null;
        }

        let pdfUrl: string | null = null;
        let pdfStorageKey: string | null = null;
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
        }

        return this.sponsorRepository.create({
            tournamentId: input.tournamentId,
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
            createdByUserId: input.userId,
        });
    }
}