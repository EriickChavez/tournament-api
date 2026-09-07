// Requiere agregar las dependencias: `npm install multer` y `npm install -D @types/multer`
// (no estaban en el proyecto porque ningún módulo anterior subía archivos).
import multer from 'multer';
import { ALLOWED_MIME_TYPES, MAX_BANNER_SIZE_BYTES } from '../schemas/branding.schemas.js';

// El límite de multer es global por request; el chequeo fino por campo
// (2MB logo vs 5MB banner) se hace en el controller una vez separados los
// archivos, aquí solo se usa el más permisivo como techo duro.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BANNER_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
            callback(new Error('INVALID_FILE_TYPE'));
            return;
        }
        callback(null, true);
    },
});

export const uploadBrandingFiles = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
]);