import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { ImportFileTooLargeError, InvalidImportFileError } from '../../domain/errors/import.errors.js';

export const MAX_IMPORT_FILE_MB = 5;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMPORT_FILE_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (file.mimetype !== XLSX_MIME) {
            callback(new Error('INVALID_IMPORT_TYPE'));
            return;
        }
        callback(null, true);
    },
}).single('file');

export function uploadImportFile(req: Request, res: Response, next: NextFunction): void {
    upload(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            next(new ImportFileTooLargeError(MAX_IMPORT_FILE_MB));
            return;
        }

        if (error instanceof Error && error.message === 'INVALID_IMPORT_TYPE') {
            next(new InvalidImportFileError('Only .xlsx files are accepted.'));
            return;
        }

        next(error);
    });
}