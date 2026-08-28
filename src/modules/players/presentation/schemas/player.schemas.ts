import { z } from 'zod';

export const createPlayerSchema = z.object({
    categoryId: z.string().uuid(),
    teamId: z.string().uuid(),
    firstName: z.string().min(1).max(120),
    lastName: z.string().min(1).max(120),
    birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'birthDate must be YYYY-MM-DD')
        .optional(),
    number: z.number().int().min(0).max(999),
    isCaptain: z.boolean().optional(),
    role: z.string().max(50).optional(),
});

export const updatePlayerSchema = z.object({
    categoryId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
    firstName: z.string().min(1).max(120).optional(),
    lastName: z.string().min(1).max(120).optional(),
    birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'birthDate must be YYYY-MM-DD')
        .nullable()
        .optional(),
    number: z.number().int().min(0).max(999).optional(),
    isCaptain: z.boolean().optional(),
    role: z.string().max(50).nullable().optional(),
});
