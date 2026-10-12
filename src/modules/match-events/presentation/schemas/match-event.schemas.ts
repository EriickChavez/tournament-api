import { z } from 'zod';

const eventTypeEnum = z.enum([
    'gol',
    'gol_penal',
    'autogol',
    'asistencia',
    'tarjeta_amarilla',
    'tarjeta_roja',
    'cambio',
    'otro',
]);

export const createMatchEventSchema = z.object({
    eventType: eventTypeEnum,
    minute: z.number().int().min(0).max(200).optional(),
    teamId: z.string().uuid(),
    playerId: z.string().uuid().optional(),
    assistedByPlayerId: z.string().uuid().optional(),
    substitutePlayerId: z.string().uuid().optional(),
    description: z.string().max(255).optional(),
    clientEventId: z.string().uuid().optional(),
    occurredAt: z.string().datetime({ offset: true }).optional(),
});

// strict: eventType, teamId y clientEventId no son editables; enviarlos da VALIDATION_ERROR.
export const updateMatchEventSchema = z
    .object({
        minute: z.number().int().min(0).max(200).nullable().optional(),
        playerId: z.string().uuid().nullable().optional(),
        assistedByPlayerId: z.string().uuid().nullable().optional(),
        substitutePlayerId: z.string().uuid().nullable().optional(),
        description: z.string().max(255).nullable().optional(),
        occurredAt: z.string().datetime({ offset: true }).nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided.',
    });