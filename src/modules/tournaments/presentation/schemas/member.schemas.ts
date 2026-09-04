import { z } from 'zod';
import { paginationQuerySchema } from '../../../../shared/utils/pagination.js';

export const inviteMemberSchema = z.object({
    userId: z.string().uuid(),
});

export const listMembersQuerySchema = paginationQuerySchema;