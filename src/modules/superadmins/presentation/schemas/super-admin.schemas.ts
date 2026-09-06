import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);

export const registerSuperAdminSchema = z.object({
    email: z.string().email().max(255),
    password: passwordSchema,
    displayName: z.string().min(1).max(120),
});

export const loginSuperAdminSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(1),
});