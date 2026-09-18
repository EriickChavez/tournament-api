import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { roles, tournamentMembers } from '../../../tournaments/infrastructure/database/schema.js';
import type { UserRepository } from '../../../auth/domain/repositories/user.repository.js';
import { EmailAlreadyInUseError } from '../../../auth/domain/errors/auth.errors.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { env } from '../../../../config/env.js';
import { z } from 'zod';
import { updateMemberSchema } from '../../presentation/schemas/member.schemas.js';

type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export class UpdateMemberUseCase {
    constructor(private readonly userRepository: UserRepository) { }

    async execute(memberId: string, input: UpdateMemberInput) {
        const [member] = await db.select().from(tournamentMembers).where(eq(tournamentMembers.id, memberId)).limit(1);
        if (!member) throw new AppError(404, 'MEMBER_NOT_FOUND', 'Miembro no encontrado.');

        const { roleId, ...userFields } = input;

        // El rol solo se valida si REALMENTE cambia. El panel manda el rol actual
        // al editar nombre/email; si es OWNER, rechazarlo ahí bloqueaba editar a
        // cualquier dueño de torneo.
        const newRoleId = roleId !== undefined && roleId !== member.roleId ? roleId : undefined;
        if (newRoleId !== undefined) {
            if (newRoleId === env.OWNER_ROLE_ID) {
                throw new AppError(400, 'CANNOT_ASSIGN_OWNER', 'El rol de owner no se asigna manualmente, solo se obtiene al crear un torneo.');
            }
            if (member.roleId === env.OWNER_ROLE_ID) {
                throw new AppError(400, 'CANNOT_MODIFY_OWNER', 'No se puede cambiar el rol del owner del torneo.');
            }
            const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, newRoleId)).limit(1);
            if (!role) throw new AppError(400, 'ROLE_NOT_FOUND', 'El rol no existe.');
        }

        if (userFields.email) {
            const existing = await this.userRepository.findByEmail(userFields.email);
            if (existing && existing.id !== member.userId) throw new EmailAlreadyInUseError(userFields.email);
        }

        // Todas las validaciones van antes de escribir, para no dejar el rol
        // cambiado si luego falla la actualización del usuario.
        if (newRoleId !== undefined) {
            await db.update(tournamentMembers).set({ roleId: newRoleId, updatedAt: new Date() }).where(eq(tournamentMembers.id, memberId));
        }
        if (Object.keys(userFields).length > 0) {
            await this.userRepository.update(member.userId, userFields);
        }
    }
}