import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { SessionRepository } from '../../domain/repositories/session.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import {
    InvalidCredentialsError,
    AccountSuspendedError,
} from '../../domain/errors/auth.errors.js';
import type { User } from '../../domain/entities/user.entity.js';
import type { Session } from '../../domain/entities/session.entity.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class LoginUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly passwordHasher: PasswordHasher,
    ) { }

    async execute(input: { email: string; password: string }): Promise<{ user: User; session: Session }> {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user) throw new InvalidCredentialsError();

        const isValid = await this.passwordHasher.verify(user.passwordHash, input.password);
        if (!isValid) throw new InvalidCredentialsError();

        if (user.status === 'SUSPENDED') throw new AccountSuspendedError();

        const session = await this.sessionRepository.create({
            userId: user.id,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        });

        return { user, session };
    }
}
