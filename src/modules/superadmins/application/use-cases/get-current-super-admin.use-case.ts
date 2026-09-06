import type { SuperAdminRepository } from '../../domain/repositories/super-admin.repository.js';
import type { SuperAdmin } from '../../domain/entities/super-admin.entity.js';

export class GetCurrentSuperAdminUseCase {
    constructor(private readonly superAdminRepository: SuperAdminRepository) { }

    async execute(superAdminId: string): Promise<SuperAdmin | null> {
        return this.superAdminRepository.findById(superAdminId);
    }
}