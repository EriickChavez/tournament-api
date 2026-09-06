import type { User } from '../entities/user.entity.js';

export interface UserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(input: {
        email: string;
        passwordHash: string;
        displayName: string;
        avatarUrl: string | null;
    }): Promise<User>;
    update(id: string, input: { displayName?: string | undefined; email?: string | undefined; isActive?: boolean | undefined }): Promise<User>;
}