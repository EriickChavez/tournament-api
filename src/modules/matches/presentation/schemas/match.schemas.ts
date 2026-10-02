import { z } from 'zod';
import { paginationQuerySchema } from '../../../../shared/utils/pagination';

export const matchStatusSchema = z.enum([
    'scheduled',
    'in_progress',
    'finished',
    'cancelled',
    'postponed',
]);

const scoreSchema = z.number().int().min(0).max(99);

export const createMatchSchema = z.object({
    categoryId: z.string().uuid(),
    homeTeamId: z.string().uuid(),
    awayTeamId: z.string().uuid(),
    scheduledAt: z.string().datetime({ offset: true }),
    venue: z.string().max(200).optional(),
    status: matchStatusSchema.optional(),
    phaseId: z.string().uuid().nullable().optional(),
    phaseGroupId: z.string().uuid().nullable().optional(),
    round: z.number().int().positive().nullable().optional(),
});

export const updateMatchSchema = z
    .object({
        categoryId: z.string().uuid().optional(),
        homeTeamId: z.string().uuid().optional(),
        awayTeamId: z.string().uuid().optional(),
        scheduledAt: z.string().datetime({ offset: true }).optional(),
        venue: z.string().max(200).nullable().optional(),
        status: matchStatusSchema.optional(),
        phaseId: z.string().uuid().nullable().optional(),
        phaseGroupId: z.string().uuid().nullable().optional(),
        round: z.number().int().positive().nullable().optional(),
        homeScore: scoreSchema.nullable().optional(),
        awayScore: scoreSchema.nullable().optional(),
        homePenalties: scoreSchema.nullable().optional(),
        awayPenalties: scoreSchema.nullable().optional(),
    })
    // El marcador siempre viaja completo: ambos goles, o ninguno (null borra los dos).
    .refine((data) => (data.homeScore === undefined) === (data.awayScore === undefined), {
        message: 'homeScore and awayScore must be sent together.',
        path: ['homeScore'],
    })
    .refine((data) => (data.homeScore === null) === (data.awayScore === null), {
        message: 'homeScore and awayScore must both be numbers or both be null.',
        path: ['homeScore'],
    })
    // Igual con los penales.
    .refine((data) => (data.homePenalties === undefined) === (data.awayPenalties === undefined), {
        message: 'homePenalties and awayPenalties must be sent together.',
        path: ['homePenalties'],
    })
    .refine((data) => (data.homePenalties === null) === (data.awayPenalties === null), {
        message: 'homePenalties and awayPenalties must both be numbers or both be null.',
        path: ['homePenalties'],
    });

export const listMatchesQuerySchema = z
    .object({
        categoryId: z.string().uuid().optional(),
        status: matchStatusSchema.optional(),
        phaseId: z.string().uuid().optional(),
    })
    .merge(paginationQuerySchema);