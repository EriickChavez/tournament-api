import type { UserRepository } from '../../../auth/domain/repositories/user.repository.js';
import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port.js';
import { EmailAlreadyInUseError } from '../../../auth/domain/errors/auth.errors.js';

export class CreateUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
    ) { }

    async execute(input: { email: string; displayName: string; password: string }) {
        const email = input.email.toLowerCase().trim();
        const existing = await this.userRepository.findByEmail(email);
        if (existing) throw new EmailAlreadyInUseError(email);

        const passwordHash = await this.passwordHasher.hash(input.password);
        return this.userRepository.create({
            email,
            passwordHash,
            displayName: input.displayName,
            avatarUrl: null,
        });
    }
}