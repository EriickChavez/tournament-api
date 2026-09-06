import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { superAdmins } from './schema.js';
import type { SuperAdminRepository } from '../../domain/repositories/super-admin.repository.js';
import type { SuperAdmin } from '../../domain/entities/super-admin.entity.js';

export class DrizzleSuperAdminRepository implements SuperAdminRepository {
    async findByEmail(email: string): Promise<SuperAdmin | null> {
        const [row] = await db.select().from(superAdmins).where(eq(superAdmins.email, email)).limit(1);
        return row ?? null;
    }

    async findById(id: string): Promise<SuperAdmin | null> {
        const [row] = await db.select().from(superAdmins).where(eq(superAdmins.id, id)).limit(1);
        return row ?? null;
    }

    async create(input: {
        email: string;
        passwordHash: string;
        displayName: string;
    }): Promise<SuperAdmin> {
        const [row] = await db.insert(superAdmins).values(input).returning();
        if (!row) throw new Error('Failed to create superadmin');
        return row;
    }
}