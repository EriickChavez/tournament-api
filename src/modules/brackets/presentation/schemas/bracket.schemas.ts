import { z } from 'zod';

export const generateBracketSchema = z.object({
    // Fase de grupos cerrada de la que salen los clasificados.
    sourcePhaseId: z.string().uuid(),
    // Incluye el partido por el tercer lugar (si hay semifinales).
    thirdPlace: z.boolean().optional(),
});

export const scheduleBracketNodeSchema = z.object({
    // Fecha y hora con zona horaria (ISO 8601), igual que al crear un partido.
    scheduledAt: z.string().datetime({ offset: true }),
    venue: z.string().max(200).optional(),
});