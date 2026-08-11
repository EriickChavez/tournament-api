import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { SessionRepository } from '../../domain/repositories/session.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import { EmailAlreadyInUseError } from '../../domain/errors/auth.errors.js';
import type { User } from '../../domain/entities/user.entity.js';
import type { Session } from '../../domain/entities/session.entity.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export class RegisterUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly passwordHasher: PasswordHasher,
    ) { }

    async execute(input: {
        email: string;
        password: string;
        name: string;
    }): Promise<{ user: User; session: Session }> {
        const existing = await this.userRepository.findByEmail(input.email);
        if (existing) throw new EmailAlreadyInUseError(input.email);

        const passwordHash = await this.passwordHasher.hash(input.password);
        const user = await this.userRepository.create({
            email: input.email,
            passwordHash,
            name: input.name,
        });

        const session = await this.sessionRepository.create({
            userId: user.id,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        });

        return { user, session };
    }
}
