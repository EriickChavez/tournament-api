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

const DUMMY_HASH =
    '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzYWx0c2FsdA$XZ1e9Q8Q3g8Xb5w0YJZ6yQ6l3F0vQ8kQ9c1sVYQxRxY';

export class LoginUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly passwordHasher: PasswordHasher,
    ) { }

    async execute(input: { email: string; password: string }): Promise<{ user: User; session: Session }> {
        const user = await this.userRepository.findByEmail(input.email);

        const isValid = await this.passwordHasher.verify(
            user?.passwordHash ?? DUMMY_HASH,
            input.password,
        );

        if (!user || !isValid) {
            throw new InvalidCredentialsError();
        }

        if (!user.isActive) throw new AccountSuspendedError();

        const session = await this.sessionRepository.create({
            userId: user.id,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        });

        return { user, session };
    }
}