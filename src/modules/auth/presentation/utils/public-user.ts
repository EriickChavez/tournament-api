import type { User } from '../../domain/entities/user.entity.js';

export function toPublicUser(user: User) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
    };
}
