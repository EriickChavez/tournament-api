import type { SuperAdmin } from '../entities/super-admin.entity.js';

export interface SuperAdminRepository {
    findByEmail(email: string): Promise<SuperAdmin | null>;
    findById(id: string): Promise<SuperAdmin | null>;
    create(input: {
        email: string;
        passwordHash: string;
        displayName: string;
    }): Promise<SuperAdmin>;
}