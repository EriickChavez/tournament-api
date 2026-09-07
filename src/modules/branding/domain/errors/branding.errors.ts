import { AppError } from '../../../../shared/errors/app-error.js';

export class BrandingNotFoundError extends AppError {
    constructor() {
        super(404, 'BRANDING_NOT_FOUND', 'Tournament branding not found.');
    }
}

export class InvalidFileTypeError extends AppError {
    constructor(allowed: string[]) {
        super(400, 'INVALID_FILE_TYPE', `File must be one of: ${allowed.join(', ')}.`);
    }
}

export class FileTooLargeError extends AppError {
    constructor(maxSizeMb: number) {
        super(400, 'FILE_TOO_LARGE', `File exceeds the maximum size of ${maxSizeMb}MB.`);
    }
}

export class NoFileProvidedError extends AppError {
    constructor() {
        super(400, 'NO_FILE_PROVIDED', 'At least one of "logo" or "banner" must be provided.');
    }
}