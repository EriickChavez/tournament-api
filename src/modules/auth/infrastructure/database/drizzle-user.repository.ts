import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { users } from './schema.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { User } from '../../domain/entities/user.entity.js';

export class DrizzleUserRepository implements UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return row ?? null;
    }

    async findById(id: string): Promise<User | null> {
        const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return row ?? null;
    }

    async create(input: { email: string; passwordHash: string; name: string }): Promise<User> {
        const [row] = await db.insert(users).values(input).returning();
        if (!row) throw new Error('Failed to create user');
        return row;
    }
}
