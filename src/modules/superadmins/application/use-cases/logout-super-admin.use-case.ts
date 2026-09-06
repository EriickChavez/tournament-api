import type { SuperAdminSessionRepository } from '../../domain/repositories/super-admin-session.repository.js';

export class LogoutSuperAdminUseCase {
    constructor(private readonly sessionRepository: SuperAdminSessionRepository) { }

    async execute(sessionId: string): Promise<void> {
        await this.sessionRepository.delete(sessionId);
    }
}