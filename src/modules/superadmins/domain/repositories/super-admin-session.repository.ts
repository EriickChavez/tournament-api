import type { SuperAdminSession } from '../entities/super-admin-session.entity.js';

export interface SuperAdminSessionRepository {
    create(input: { superAdminId: string; expiresAt: Date }): Promise<SuperAdminSession>;
    findById(id: string): Promise<SuperAdminSession | null>;
    delete(id: string): Promise<void>;
    deleteAllForSuperAdmin(superAdminId: string): Promise<void>;
    updateExpiresAt(id: string, expiresAt: Date): Promise<void>;
}