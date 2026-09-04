import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserNotFoundError } from '../../domain/errors/auth.errors.js';

export class LookupUserUseCase {
    constructor(private readonly userRepository: UserRepository) { }

    async execute(input: { email: string }): Promise<{ id: string; displayName: string; avatarUrl: string | null }> {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user || !user.isActive) throw new UserNotFoundError();

        return {
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
        };
    }
}