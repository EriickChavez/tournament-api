import { z } from 'zod';
import { paginationQuerySchema } from '../../../../shared/utils/pagination';

export const matchStatusSchema = z.enum([
    'scheduled',
    'in_progress',
    'finished',
    'cancelled',
    'postponed',
]);

// Al crear solo se puede programar, cancelar o posponer: iniciar y finalizar van por /start y /finish.
const createMatchStatusSchema = z.enum(['scheduled', 'cancelled', 'postponed']);

const scoreSchema = z.number().int().min(0).max(99);

export const createMatchSchema = z.object({
    categoryId: z.string().uuid(),
    homeTeamId: z.string().uuid(),
    awayTeamId: z.string().uuid(),
    scheduledAt: z.string().datetime({ offset: true }),
    venue: z.string().max(200).optional(),
    status: createMatchStatusSchema.optional(),
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
        // homeScore y awayScore se derivan de los eventos de gol, no se aceptan manualmente.
        homePenalties: scoreSchema.nullable().optional(),
        awayPenalties: scoreSchema.nullable().optional(),
    })
    // Los penales siempre viajan completos.
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

export const listMyMatchesQuerySchema = z
    .object({
        tournamentId: z.string().uuid().optional(),
        status: matchStatusSchema.optional(),
        from: z.string().datetime({ offset: true }).optional(),
        to: z.string().datetime({ offset: true }).optional(),
    })
    .merge(paginationQuerySchema);

export const setMatchRefereesSchema = z.object({
    userIds: z.array(z.string().uuid()).max(10),
});