import { z } from 'zod';

const eventTypeEnum = z.enum(['gol', 'asistencia', 'tarjeta_amarilla', 'tarjeta_roja', 'cambio', 'otro']);

export const createMatchEventSchema = z.object({
    eventType: eventTypeEnum,
    minute: z.number().int().min(0).max(200).optional(),
    teamId: z.string().uuid(),
    playerId: z.string().uuid().optional(),
    assistedByPlayerId: z.string().uuid().optional(),
    description: z.string().max(255).optional(),
});
