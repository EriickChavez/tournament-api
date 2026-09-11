import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import {
    ALLOWED_LOGO_MIME_TYPES,
    ALLOWED_PDF_MIME_TYPES,
    MAX_LOGO_SIZE_BYTES,
    MAX_LOGO_SIZE_MB,
    MAX_PDF_SIZE_BYTES,
    MAX_PDF_SIZE_MB,
} from '../schemas/app-sponsor.schemas.js';
import { FileTooLargeError, InvalidFileTypeError } from '../../domain/errors/app-sponsor.errors.js';

// El límite de multer es global por request; el chequeo fino por campo
// (2MB logo vs 10MB pdf) se hace abajo, una vez que multer ya distinguió
// cuál MulterError.field disparó el límite.
const MAX_UPLOAD_SIZE_BYTES = Math.max(MAX_LOGO_SIZE_BYTES, MAX_PDF_SIZE_BYTES);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
        if (
            file.fieldname === 'logo' &&
            !ALLOWED_LOGO_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_LOGO_MIME_TYPES)[number])
        ) {
            callback(new Error('INVALID_LOGO_TYPE'));
            return;
        }
        if (
            file.fieldname === 'pdf' &&
            !ALLOWED_PDF_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_PDF_MIME_TYPES)[number])
        ) {
            callback(new Error('INVALID_PDF_TYPE'));
            return;
        }
        callback(null, true);
    },
});

const uploadFields = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'pdf', maxCount: 1 },
]);

/**
 * Wrapper sobre multer que traduce sus errores (fileFilter y límite de
 * tamaño) al mismo formato de AppError que usa el resto de la API. Sin esto,
 * un archivo inválido o demasiado grande cae al handler genérico y responde
 * 500 en vez de 400.
 */
export function uploadAppSponsorFiles(req: Request, res: Response, next: NextFunction): void {
    uploadFields(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            const field = error.field === 'pdf' ? 'pdf' : 'logo';
            const maxMb = field === 'pdf' ? MAX_PDF_SIZE_MB : MAX_LOGO_SIZE_MB;
            next(new FileTooLargeError(field, maxMb));
            return;
        }

        if (error instanceof Error && error.message === 'INVALID_LOGO_TYPE') {
            next(new InvalidFileTypeError('logo', ALLOWED_LOGO_MIME_TYPES));
            return;
        }

        if (error instanceof Error && error.message === 'INVALID_PDF_TYPE') {
            next(new InvalidFileTypeError('pdf', ALLOWED_PDF_MIME_TYPES));
            return;
        }

        next(error);
    });
}