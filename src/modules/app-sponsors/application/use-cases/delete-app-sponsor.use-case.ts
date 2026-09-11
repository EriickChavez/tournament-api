import type { AppSponsorRepository } from '../../domain/repositories/app-sponsor.repository.js';
import type { FileStorage } from '../ports/file-storage.port.js';
import { AppSponsorNotFoundError } from '../../domain/errors/app-sponsor.errors.js';

export class DeleteAppSponsorUseCase {
    constructor(
        private readonly appSponsorRepository: AppSponsorRepository,
        private readonly fileStorage: FileStorage,
    ) { }

    async execute(id: string): Promise<void> {
        const sponsor = await this.appSponsorRepository.findById(id);
        if (!sponsor) throw new AppSponsorNotFoundError();

        if (sponsor.logoStorageKey) {
            await this.fileStorage.delete(sponsor.logoStorageKey).catch(() => undefined);
        }
        if (sponsor.pdfStorageKey) {
            await this.fileStorage.delete(sponsor.pdfStorageKey).catch(() => undefined);
        }

        await this.appSponsorRepository.delete(id);
    }
}