import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);

export const registerSchema = z.object({
    email: z.string().email().max(255),
    password: passwordSchema,
    name: z.string().min(1).max(255),
});

export const loginSchema = z.object({
    email: z.string().email().max(255),
    password: passwordSchema,
});