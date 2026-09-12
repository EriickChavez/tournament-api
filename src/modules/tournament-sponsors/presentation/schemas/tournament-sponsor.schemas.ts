import { z } from 'zod';

export const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'] as const;
export const ALLOWED_PDF_MIME_TYPES = ['application/pdf'] as const;

export const MAX_LOGO_SIZE_MB = 2;
export const MAX_PDF_SIZE_MB = 10;
export const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;
export const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'Date must be in YYYY-MM-DD format';

const emptyToUndefined = (val: unknown): unknown => (val === '' ? undefined : val);
const emptyToNull = (val: unknown): unknown => (val === '' ? null : val);

function booleanFromString<T extends z.ZodTypeAny>(schema: T) {
    return z.preprocess((val) => {
        if (val === undefined || typeof val === 'boolean') return val;
        if (val === 'true') return true;
        if (val === 'false') return false;
        return val;
    }, schema);
}

function numberFromString<T extends z.ZodTypeAny>(schema: T) {
    return z.preprocess((val) => {
        if (val === undefined || val === '' || typeof val === 'number')
            return val === '' ? undefined : val;
        const parsed = Number(val);
        return Number.isNaN(parsed) ? val : parsed;
    }, schema);
}

export const tournamentSponsorParamsSchema = z.object({
    tournamentId: z.string().uuid('Tournament id must be a valid UUID'),
    id: z.string().uuid('Sponsor id must be a valid UUID').optional(),
});

export const createTournamentSponsorSchema = z
    .object({
        name: z.string().min(1, 'Name is required').max(200),
        description: z.string().min(1, 'Description is required').max(500),
        logoUrl: z.preprocess(
            emptyToUndefined,
            z.string().url('logoUrl must be a valid URL').max(512).optional(),
        ),
        websiteUrl: z.preprocess(
            emptyToUndefined,
            z.string().url('websiteUrl must be a valid URL').max(512).optional(),
        ),
        pdfUrl: z.preprocess(
            emptyToUndefined,
            z.string().url('pdfUrl must be a valid URL').max(512).optional(),
        ),
        order: numberFromString(z.number().int().optional()),
        isActive: booleanFromString(z.boolean().optional()),
        startDate: z.preprocess(emptyToUndefined, z.string().regex(DATE_RE, DATE_MESSAGE).optional()),
        endDate: z.preprocess(emptyToUndefined, z.string().regex(DATE_RE, DATE_MESSAGE).optional()),
    })
    .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
        message: 'endDate must be on or after startDate',
        path: ['endDate'],
    });

export const updateTournamentSponsorSchema = z
    .object({
        name: z.string().min(1).max(200).optional(),
        description: z.string().min(1).max(500).optional(),
        logoUrl: z.preprocess(
            emptyToUndefined,
            z.string().url().max(512).optional(),
        ),
        websiteUrl: z.preprocess(
            emptyToNull,
            z.string().url().max(512).nullable().optional(),
        ),
        pdfUrl: z.preprocess(
            emptyToUndefined,
            z.string().url().max(512).optional(),
        ),
        removePdf: booleanFromString(z.boolean().optional()),
        order: numberFromString(z.number().int().optional()),
        isActive: booleanFromString(z.boolean().optional()),
        startDate: z.preprocess(
            emptyToNull,
            z.string().regex(DATE_RE, DATE_MESSAGE).nullable().optional(),
        ),
        endDate: z.preprocess(
            emptyToNull,
            z.string().regex(DATE_RE, DATE_MESSAGE).nullable().optional(),
        ),
    })
    .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
        message: 'endDate must be on or after startDate',
        path: ['endDate'],
    });