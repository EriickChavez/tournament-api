import type { SuperAdminSessionRepository } from '../../domain/repositories/super-admin-session.repository.js';

export class LogoutAllSuperAdminUseCase {
    constructor(private readonly sessionRepository: SuperAdminSessionRepository) { }

    async execute(superAdminId: string): Promise<void> {
        await this.sessionRepository.deleteAllForSuperAdmin(superAdminId);
    }
}