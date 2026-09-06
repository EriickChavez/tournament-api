import type { SuperAdmin } from '../../domain/entities/super-admin.entity.js';

export function toPublicSuperAdmin(superAdmin: SuperAdmin) {
    return {
        id: superAdmin.id,
        email: superAdmin.email,
        displayName: superAdmin.displayName,
        isActive: superAdmin.isActive,
    };
}