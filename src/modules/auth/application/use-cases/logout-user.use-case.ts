import type { SessionRepository } from '../../domain/repositories/session.repository.js';

export class LogoutUserUseCase {
    constructor(private readonly sessionRepository: SessionRepository) { }

    async execute(sessionId: string): Promise<void> {
        await this.sessionRepository.delete(sessionId);
    }
}
