import { z } from 'zod';

export const inviteMemberSchema = z.object({
    userId: z.string().uuid(),
});