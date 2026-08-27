import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const dateSchema = z
    .string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional();

const timezoneSchema = z
    .string()
    .max(60)
    .refine(
        (val) => {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: val });
                return true;
            } catch {
                return false;
            }
        },
        { message: 'Invalid IANA timezone (e.g. America/Mexico_City)' },
    )
    .optional();

export const createTournamentSchema = z
    .object({
        name: z.string().min(1).max(200),
        subtitle: z.string().max(255).optional(),
        description: z.string().max(2000).optional(),
        startDate: dateSchema,
        endDate: dateSchema,
        timezone: timezoneSchema,
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

export const updateTournamentSchema = z
    .object({
        name: z.string().min(1).max(200).optional(),
        subtitle: z.string().max(255).optional(),
        description: z.string().max(2000).optional(),
        startDate: dateSchema,
        endDate: dateSchema,
        timezone: timezoneSchema,
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
