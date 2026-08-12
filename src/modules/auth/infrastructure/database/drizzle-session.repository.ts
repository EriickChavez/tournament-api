import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { sessions } from './schema.js';
import type { SessionRepository } from '../../domain/repositories/session.repository.js';
import type { Session } from '../../domain/entities/session.entity.js';

export class DrizzleSessionRepository implements SessionRepository {
    async create(input: { userId: string; expiresAt: Date }): Promise<Session> {
        const id = randomBytes(32).toString('hex');
        const [row] = await db
            .insert(sessions)
            .values({ id, userId: input.userId, expiresAt: input.expiresAt })
            .returning();
        if (!row) throw new Error('Failed to create session');
        return row;
    }

    async findById(id: string): Promise<Session | null> {
        const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
        return row ?? null;
    }

    async delete(id: string): Promise<void> {
        await db.delete(sessions).where(eq(sessions.id, id));
    }

    async deleteAllForUser(userId: string): Promise<void> {
        await db.delete(sessions).where(eq(sessions.userId, userId));
    }

    async updateExpiresAt(id: string, expiresAt: Date): Promise<void> {
        await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    }
}