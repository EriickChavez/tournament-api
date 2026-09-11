import type { AppSponsor } from '../../domain/entities/app-sponsor.entity.js';
import type { AppSponsorRepository } from '../../domain/repositories/app-sponsor.repository.js';

export class ListPublicAppSponsorsUseCase {
    constructor(private readonly appSponsorRepository: AppSponsorRepository) { }

    async execute(): Promise<AppSponsor[]> {
        return this.appSponsorRepository.listPublic(new Date());
    }
}