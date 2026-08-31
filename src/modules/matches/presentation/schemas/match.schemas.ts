import { z } from 'zod';
import { paginationQuerySchema } from '../../../../shared/utils/pagination';

export const matchStatusSchema = z.enum([
    'scheduled',
    'in_progress',
    'finished',
    'cancelled',
    'postponed',
]);

export const createMatchSchema = z.object({
    categoryId: z.string().uuid(),
    homeTeamId: z.string().uuid(),
    awayTeamId: z.string().uuid(),
    scheduledAt: z.string().datetime({ offset: true }),
    venue: z.string().max(200).optional(),
    status: matchStatusSchema.optional(),
});

export const updateMatchSchema = z.object({
    categoryId: z.string().uuid().optional(),
    homeTeamId: z.string().uuid().optional(),
    awayTeamId: z.string().uuid().optional(),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    venue: z.string().max(200).nullable().optional(),
    status: matchStatusSchema.optional(),
});

export const listMatchesQuerySchema = z
    .object({
        categoryId: z.string().uuid().optional(),
        status: matchStatusSchema.optional(),
    })
    .merge(paginationQuerySchema);