import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);
const emailSchema = z.string().trim().toLowerCase().email().max(255);

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().min(1).max(120),
    avatarUrl: z.string().url().max(500).optional(),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1),
});

export const lookupUserQuerySchema = z.object({
    email: emailSchema,
});