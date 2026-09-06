import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { superAdminSessions } from './schema.js';
import type { SuperAdminSessionRepository } from '../../domain/repositories/super-admin-session.repository.js';
import type { SuperAdminSession } from '../../domain/entities/super-admin-session.entity.js';

export class DrizzleSuperAdminSessionRepository implements SuperAdminSessionRepository {
    async create(input: { superAdminId: string; expiresAt: Date }): Promise<SuperAdminSession> {
        const id = randomBytes(32).toString('hex');
        const [row] = await db
            .insert(superAdminSessions)
            .values({ id, superAdminId: input.superAdminId, expiresAt: input.expiresAt })
            .returning();
        if (!row) throw new Error('Failed to create superadmin session');
        return row;
    }

    async findById(id: string): Promise<SuperAdminSession | null> {
        const [row] = await db.select().from(superAdminSessions).where(eq(superAdminSessions.id, id)).limit(1);
        return row ?? null;
    }

    async delete(id: string): Promise<void> {
        await db.delete(superAdminSessions).where(eq(superAdminSessions.id, id));
    }

    async deleteAllForSuperAdmin(superAdminId: string): Promise<void> {
        await db.delete(superAdminSessions).where(eq(superAdminSessions.superAdminId, superAdminId));
    }

    async updateExpiresAt(id: string, expiresAt: Date): Promise<void> {
        await db.update(superAdminSessions).set({ expiresAt }).where(eq(superAdminSessions.id, id));
    }
}