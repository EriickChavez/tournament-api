import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);

export const registerSchema = z.object({
    email: z.string().email().max(255),
    password: passwordSchema,
    displayName: z.string().min(1).max(120),
    avatarUrl: z.string().url().max(500).optional(),
});

export const loginSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(1),
});

export const lookupUserQuerySchema = z.object({
    email: z.string().email().max(255),
});
