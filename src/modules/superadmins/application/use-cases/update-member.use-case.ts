import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { tournamentMembers } from '../../../tournaments/infrastructure/database/schema.js';
import type { UserRepository } from '../../../auth/domain/repositories/user.repository.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { env } from '../../../../config/env.js';
import { z } from 'zod';
import { updateMemberSchema } from '../../presentation/schemas/member.schemas.js';

type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export class UpdateMemberUseCase {
    constructor(private readonly userRepository: UserRepository) { }

    async execute(memberId: string, input: UpdateMemberInput) {
        if (input.roleId === env.OWNER_ROLE_ID) {
            throw new AppError(400, 'CANNOT_ASSIGN_OWNER', 'El rol de owner no se asigna manualmente, solo se obtiene al crear un torneo.');
        }

        const [member] = await db.select().from(tournamentMembers).where(eq(tournamentMembers.id, memberId)).limit(1);
        if (!member) throw new AppError(404, 'MEMBER_NOT_FOUND', 'Miembro no encontrado.');

        if (input.roleId) {
            await db.update(tournamentMembers).set({ roleId: input.roleId, updatedAt: new Date() }).where(eq(tournamentMembers.id, memberId));
        }

        const { roleId: _roleId, ...userFields } = input;
        if (Object.keys(userFields).length > 0) {
            await this.userRepository.update(member.userId, userFields);
        }
    }
}