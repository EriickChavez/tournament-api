import { z } from 'zod';

export const generateBracketSchema = z.object({
    // Fase de grupos cerrada de la que salen los clasificados.
    sourcePhaseId: z.string().uuid(),
    // Incluye el partido por el tercer lugar (si hay semifinales).
    thirdPlace: z.boolean().optional(),
    // Cruces del cuadro principal a ida y vuelta. Sin gol de visitante: un global empatado va a penales.
    twoLegged: z.boolean().optional(),
    // Con ida y vuelta, la final a partido único (por defecto sí).
    singleLegFinal: z.boolean().optional(),
});

export const scheduleBracketNodeSchema = z.object({
    // Fecha y hora con zona horaria (ISO 8601), igual que al crear un partido.
    scheduledAt: z.string().datetime({ offset: true }),
    venue: z.string().max(200).optional(),
    // 1 = partido único o ida (por defecto); 2 = vuelta.
    leg: z.union([z.literal(1), z.literal(2)]).optional(),
});

const penaltyScoreSchema = z.number().int().min(0).max(99);

// Penales de un cruce a dos partidos. Ambos números, o ambos null para borrarlos.
export const setBracketNodePenaltiesSchema = z
    .object({
        homePenalties: penaltyScoreSchema.nullable(),
        awayPenalties: penaltyScoreSchema.nullable(),
    })
    .refine((data) => (data.homePenalties === null) === (data.awayPenalties === null), {
        message: 'homePenalties and awayPenalties must both be numbers or both be null.',
        path: ['homePenalties'],
    });