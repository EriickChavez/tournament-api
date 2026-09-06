import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    displayName: z.string().min(1).max(120),
    password: z.string().min(8).max(128),
});

export const updateMemberSchema = z.object({
    roleId: z.string().uuid().optional(),
    displayName: z.string().min(1).max(120).optional(),
    email: z.string().email().optional(),
    isActive: z.boolean().optional(),
});