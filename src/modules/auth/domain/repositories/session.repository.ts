import type { Session } from '../entities/session.entity.js';

export interface SessionRepository {
    create(input: { userId: string; expiresAt: Date }): Promise<Session>;
    findById(id: string): Promise<Session | null>;
    delete(id: string): Promise<void>;
    deleteAllForUser(userId: string): Promise<void>;
    updateExpiresAt(id: string, expiresAt: Date): Promise<void>;
}
