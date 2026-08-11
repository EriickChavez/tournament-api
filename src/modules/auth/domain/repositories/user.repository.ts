import type { User } from '../domain/user.entity.js';

export interface UserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(input: { email: string; passwordHash: string; name: string }): Promise<User>;
}
