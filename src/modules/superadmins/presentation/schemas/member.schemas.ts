import { paginationQuerySchema } from '../../../../shared/utils/pagination.js';
import { z } from 'zod';

export const createUserSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    displayName: z.string().min(1).max(120),
    password: z.string().min(8).max(128),
});

export const memberParamsSchema = z.object({
    memberId: z.string().uuid(),
});

export const deleteUserParamsSchema = z.object({
    userId: z.string().uuid(),
});

export const updateMemberSchema = z.object({
    roleId: z.string().uuid().optional(),
    displayName: z.string().min(1).max(120).optional(),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
    isActive: z.boolean().optional(),
});

export const inviteMemberSchema = z.object({
    userId: z.string().uuid(),
});

export const listMembersQuerySchema = paginationQuerySchema;

export const createMemberAccountSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(255),
    displayName: z.string().trim().min(1).max(120),
    password: z.string().min(8).max(128),
});