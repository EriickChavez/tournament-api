import { env } from '../../../../config/env.js';
import type { TournamentBranding } from '../../domain/entities/branding.entity.js';
import type { BrandingRepository } from '../../domain/repositories/branding.repository.js';
import type { FileStorage } from '../ports/file-storage.port.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import {
    NotTournamentOwnerError,
    TournamentNotFoundError,
} from '../../../tournaments/domain/errors/tournaments.errors.js';
import { NoFileProvidedError } from '../../domain/errors/branding.errors.js';

export class UpsertTournamentBrandingUseCase {
    constructor(
        private readonly brandingRepository: BrandingRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly fileStorage: FileStorage,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
        logo?: { buffer: Buffer; mimeType: string } | undefined;
        banner?: { buffer: Buffer; mimeType: string } | undefined;
    }): Promise<TournamentBranding> {
        if (!input.logo && !input.banner) {
            throw new NoFileProvidedError();
        }

        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        const slug = tournament.slug;
        let logoUrl: string | undefined;
        let bannerUrl: string | undefined;

        if (input.logo) {
            const stored = await this.fileStorage.upload({
                buffer: input.logo.buffer,
                mimeType: input.logo.mimeType,
                key: `${slug}/${slug}-logo`,
            });
            logoUrl = stored.url;
        }

        if (input.banner) {
            const stored = await this.fileStorage.upload({
                buffer: input.banner.buffer,
                mimeType: input.banner.mimeType,
                key: `${slug}/${slug}-banner`,
            });
            bannerUrl = stored.url;
        }

        // El nombre de archivo es fijo por slug (slug-logo.webp / slug-banner.webp),
        // así que cada subida reemplaza al anterior en el mismo path — el borrado
        // explícito del archivo viejo ocurre dentro del adapter de storage
        // (ver LocalDiskFileStorage.upload).

        return this.brandingRepository.upsert({
            tournamentId: input.tournamentId,
            logoUrl,
            bannerUrl,
            updatedByUserId: input.userId,
        });
    }
}