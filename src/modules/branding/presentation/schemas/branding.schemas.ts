import { z } from 'zod';

export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

// Límites sugeridos — a confirmar (ver ROADMAP.md, sección de branding).
export const MAX_LOGO_SIZE_MB = 2;
export const MAX_BANNER_SIZE_MB = 5;
export const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;
export const MAX_BANNER_SIZE_BYTES = MAX_BANNER_SIZE_MB * 1024 * 1024;

// El body llega como multipart/form-data (multer ya separó los archivos en
// req.files), así que aquí solo se valida que venga :id como uuid en la ruta.
export const brandingParamsSchema = z.object({
    id: z.string().uuid('Tournament id must be a valid UUID'),
});