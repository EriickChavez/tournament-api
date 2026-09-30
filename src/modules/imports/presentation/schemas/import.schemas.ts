import { z } from 'zod';

export const importQuerySchema = z.object({
    dryRun: z.enum(['true', 'false']).optional(),
});