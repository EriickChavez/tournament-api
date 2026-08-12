import type { SessionRepository } from '../../domain/repositories/session.repository.js';

export class LogoutAllUseCase {
    constructor(private readonly sessionRepository: SessionRepository) { }

    async execute(userId: string): Promise<void> {
        await this.sessionRepository.deleteAllForUser(userId);
    }
}
