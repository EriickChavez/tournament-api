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

export const setManualRanksSchema = z.object({
    // group = desempate dentro de cada grupo; best_next = entre los mejores de varios grupos.
    scope: z.enum(['group', 'best_next']),
    // Reemplaza todas las decisiones de ese tipo; una lista vacía las borra.
    ranks: z
        .array(
            z.object({
                teamId: z.string().uuid(),
                rank: z.number().int().min(1).max(999),
            }),
        )
        .max(500),
});