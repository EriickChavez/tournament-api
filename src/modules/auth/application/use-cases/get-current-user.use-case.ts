import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { User } from '../../domain/entities/user.entity.js';

export class GetCurrentUserUseCase {
    constructor(private readonly userRepository: UserRepository) { }

    async execute(userId: string): Promise<User | null> {
        return this.userRepository.findById(userId);
    }
}
