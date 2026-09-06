import type { SuperAdminRepository } from '../../domain/repositories/super-admin.repository.js';
import type { SuperAdminSessionRepository } from '../../domain/repositories/super-admin-session.repository.js';
import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port.js';
import type { SuperAdmin } from '../../domain/entities/super-admin.entity.js';
import type { SuperAdminSession } from '../../domain/entities/super-admin-session.entity.js';
import { InvalidSuperAdminCredentialsError, SuperAdminAccountSuspendedError } from '../../domain/domain/errors/super-admin.errors.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DUMMY_HASH =
    '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzYWx0c2FsdA$XZ1e9Q8Q3g8Xb5w0YJZ6yQ6l3F0vQ8kQ9c1sVYQxRxY';

export class LoginSuperAdminUseCase {
    constructor(
        private readonly superAdminRepository: SuperAdminRepository,
        private readonly sessionRepository: SuperAdminSessionRepository,
        private readonly passwordHasher: PasswordHasher,
    ) { }

    async execute(input: { email: string; password: string }): Promise<{
        superAdmin: SuperAdmin;
        session: SuperAdminSession;
    }> {
        const superAdmin = await this.superAdminRepository.findByEmail(input.email);

        const isValid = await this.passwordHasher.verify(
            superAdmin?.passwordHash ?? DUMMY_HASH,
            input.password,
        );

        if (!superAdmin || !isValid) {
            throw new InvalidSuperAdminCredentialsError();
        }

        if (!superAdmin.isActive) throw new SuperAdminAccountSuspendedError();

        const session = await this.sessionRepository.create({
            superAdminId: superAdmin.id,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        });

        return { superAdmin, session };
    }
}