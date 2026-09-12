import type { SuperAdminRepository } from '../../domain/repositories/super-admin.repository.js';
import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port.js';
import type { SuperAdmin } from '../../domain/entities/super-admin.entity.js';
import { SuperAdminEmailAlreadyInUseError } from '../../domain/errors/super-admin.errors.js';

export class RegisterSuperAdminUseCase {
    constructor(
        private readonly superAdminRepository: SuperAdminRepository,
        private readonly passwordHasher: PasswordHasher,
    ) { }

    async execute(input: {
        email: string;
        password: string;
        displayName: string;
    }): Promise<SuperAdmin> {
        const existing = await this.superAdminRepository.findByEmail(input.email);
        if (existing) throw new SuperAdminEmailAlreadyInUseError(input.email);

        const passwordHash = await this.passwordHasher.hash(input.password);
        return this.superAdminRepository.create({
            email: input.email,
            passwordHash,
            displayName: input.displayName,
        });
    }
}