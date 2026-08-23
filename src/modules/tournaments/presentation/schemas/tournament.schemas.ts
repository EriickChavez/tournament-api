import { z } from 'zod';

export const createTournamentSchema = z.object({
    name: z.string().min(1).max(200),
    subtitle: z.string().max(255).optional(),
    description: z.string().max(2000).optional(),
});
