import { z } from 'zod';

export const phaseStandingsQuerySchema = z
    .object({
        // Cuántos primeros de cada grupo clasifican directo.
        perGroup: z.coerce.number().int().min(1).max(32).optional(),
        // Cuántos mejores del puesto siguiente entran (p. ej. 8 mejores terceros).
        bestNext: z.coerce.number().int().min(0).max(64).optional(),
    })
    .refine((query) => query.bestNext === undefined || query.perGroup !== undefined, {
        message: 'bestNext requires perGroup.',
        path: ['bestNext'],
    });