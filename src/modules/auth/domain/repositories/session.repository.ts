import type { Session } from "../domain/session.entity.js";

export interface SessionRepository {
    create(input: { userId: string; expiresAt: Date }): Promise<Session>;
    findById(id: string): Promise<Session | null>;
    delete(id: string): Promise<void>;
}
