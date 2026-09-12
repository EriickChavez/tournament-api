import { z } from 'zod';
import { paginationQuerySchema } from '../../../../shared/utils/pagination.js';

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

export const updateTournamentMaxSponsorsParamsSchema = z.object({
    id: z.string().uuid('Tournament id must be a valid UUID'),
});

export const updateTournamentMaxSponsorsBodySchema = z.object({
    maxSponsors: z.number().int().min(0).max(1000),
});

export const listTournamentsQuerySchema = paginationQuerySchema.extend({
    search: z.string().trim().min(1).max(200).optional(),
});