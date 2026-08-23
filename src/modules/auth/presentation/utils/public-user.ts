import type { User } from '../../domain/entities/user.entity.js';

export function toPublicUser(user: User) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
    };
}