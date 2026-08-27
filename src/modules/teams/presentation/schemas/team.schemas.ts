import { z } from 'zod';

export const createTeamSchema = z.object({
    categoryId: z.string().uuid(),
    name: z.string().min(1).max(200),
    abbreviation: z.string().max(50).optional(),
    logoUrl: z.string().url().max(500).optional(),
});

export const updateTeamSchema = z.object({
    categoryId: z.string().uuid().optional(),
    name: z.string().min(1).max(200).optional(),
    abbreviation: z.string().max(50).optional(),
    logoUrl: z.string().url().max(500).optional(),
});