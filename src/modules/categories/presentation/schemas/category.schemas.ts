import { z } from 'zod';

export const createCategorySchema = z
    .object({
        title: z.string().min(1, 'Title is required').max(200),
        minAge: z.number().int().min(0).max(120).nullable().optional(),
        maxAge: z.number().int().min(0).max(120).nullable().optional(),
        description: z.string().max(2000).nullable().optional(),
        order: z.number().int().optional(),
    })
    .refine(
        (data) => {
            if (
                data.minAge !== undefined &&
                data.minAge !== null &&
                data.maxAge !== undefined &&
                data.maxAge !== null
            ) {
                return data.maxAge >= data.minAge;
            }
            return true;
        },
        {
            message: 'Maximum age must be greater than or equal to minimum age',
            path: ['maxAge'],
        },
    );

export const updateCategorySchema = z
    .object({
        title: z.string().min(1, 'Title is required').max(200).optional(),
        minAge: z.number().int().min(0).max(120).nullable().optional(),
        maxAge: z.number().int().min(0).max(120).nullable().optional(),
        description: z.string().max(2000).nullable().optional(),
        order: z.number().int().optional(),
    })
    .refine(
        (data) => {
            if (
                data.minAge !== undefined &&
                data.minAge !== null &&
                data.maxAge !== undefined &&
                data.maxAge !== null
            ) {
                return data.maxAge >= data.minAge;
            }
            return true;
        },
        {
            message: 'Maximum age must be greater than or equal to minimum age',
            path: ['maxAge'],
        },
    );
