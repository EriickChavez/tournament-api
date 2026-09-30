import { AppError } from '../../../../shared/errors/app-error.js';

export class ImportFileRequiredError extends AppError {
    constructor() {
        super(400, 'IMPORT_FILE_REQUIRED', 'An .xlsx file is required in the "file" field.');
    }
}

export class InvalidImportFileError extends AppError {
    constructor(message: string) {
        super(400, 'INVALID_IMPORT_FILE', message);
    }
}

export class ImportFileTooLargeError extends AppError {
    constructor(maxMb: number) {
        super(413, 'IMPORT_FILE_TOO_LARGE', `The file exceeds the ${maxMb} MB limit.`);
    }
}

export interface ImportRowError {
    sheet: string;
    row: number;
    field?: string;
    message: string;
}

export class ImportValidationError extends AppError {
    constructor(errors: ImportRowError[], total: number) {
        super(422, 'IMPORT_VALIDATION_FAILED', `The file has ${total} error(s). Nothing was imported.`, {
            errors,
            truncated: total > errors.length,
        });
    }
}