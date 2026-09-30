import { z } from 'zod';

const phaseTypeSchema = z.enum(['group', 'knockout', 'league']);
const phaseStatusSchema = z.enum(['upcoming', 'active', 'finished']);

export const createPhaseSchema = z
    .object({
        name: z.string().min(1, 'Name is required').max(200),
        type: phaseTypeSchema,
        status: phaseStatusSchema.optional(),
        sortOrder: z.number().int().optional(),
        startDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD')
            .nullable()
            .optional(),
        endDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD')
            .nullable()
            .optional(),
    })
    .refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return data.endDate >= data.startDate;
            }
            return true;
        },
        {
            message: 'End date must be greater than or equal to start date',
            path: ['endDate'],
        },
    );

export const updatePhaseSchema = z
    .object({
        name: z.string().min(1).max(200).optional(),
        type: phaseTypeSchema.optional(),
        status: phaseStatusSchema.optional(),
        sortOrder: z.number().int().optional(),
        startDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD')
            .nullable()
            .optional(),
        endDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD')
            .nullable()
            .optional(),
    })
    .refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return data.endDate >= data.startDate;
            }
            return true;
        },
        {
            message: 'End date must be greater than or equal to start date',
            path: ['endDate'],
        },
    );

export const createPhaseGroupSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    sortOrder: z.number().int().optional(),
});

export const updatePhaseGroupSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    sortOrder: z.number().int().optional(),
});

export const syncPhaseTeamsSchema = z.object({
    teams: z.array(
        z.object({
            teamId: z.string().uuid(),
            phaseGroupId: z.string().uuid().nullable().optional(),
            seed: z.number().int().positive().nullable().optional(),
        }),
    ),
});