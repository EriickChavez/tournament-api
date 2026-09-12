import { env } from '../../../../config/env.js';
import type { TournamentSponsorRepository } from '../../domain/repositories/tournament-sponsor.repository.js';
import type { FileStorage } from '../ports/file-storage.port.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import {
    TournamentSponsorNotFoundError,
} from '../../domain/errors/tournament-sponsor.errors.js';
import { NotTournamentOwnerError } from '../../../tournaments/domain/errors/tournaments.errors.js';

export class DeleteTournamentSponsorUseCase {
    constructor(
        private readonly sponsorRepository: TournamentSponsorRepository,
        private readonly memberRepository: TournamentMemberRepository,
        private readonly fileStorage: FileStorage,
    ) { }

    async execute(input: {
        id: string;
        tournamentId: string;
        userId: string;
    }): Promise<void> {
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

        if (sponsor.logoStorageKey) {
            await this.fileStorage.delete(sponsor.logoStorageKey).catch(() => undefined);
        }
        if (sponsor.pdfStorageKey) {
            await this.fileStorage.delete(sponsor.pdfStorageKey).catch(() => undefined);
        }

        await this.sponsorRepository.delete(input.id);
    }
}