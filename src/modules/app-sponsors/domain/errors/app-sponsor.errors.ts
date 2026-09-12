import { AppError } from '../../../../shared/errors/app-error.js';

export class AppSponsorNotFoundError extends AppError {
    constructor() {
        super(404, 'APP_SPONSOR_NOT_FOUND', 'App sponsor not found.');
    }
}

export class LogoRequiredError extends AppError {
    constructor() {
        super(400, 'LOGO_REQUIRED', 'Either a logo file or a logo URL must be provided.');
    }
}

export class AmbiguousLogoInputError extends AppError {
    constructor() {
        super(400, 'AMBIGUOUS_LOGO_INPUT', 'Provide either a logo file or a logo URL, not both.');
    }
}

export class AmbiguousPdfInputError extends AppError {
    constructor() {
        super(
            400,
            'AMBIGUOUS_PDF_INPUT',
            'Provide at most one of: a pdf file, a pdf URL, or removePdf.',
        );
    }
}

export class WebsiteAndPdfConflictError extends AppError {
    constructor() {
        super(
            400,
            'WEBSITE_AND_PDF_CONFLICT',
            'A sponsor cannot have both a website URL and a PDF at the same time.',
        );
    }
}

export class InvalidFileTypeError extends AppError {
    constructor(field: string, allowed: readonly string[]) {
        super(400, 'INVALID_FILE_TYPE', `Field "${field}" must be one of: ${allowed.join(', ')}.`);
    }
}

export class FileTooLargeError extends AppError {
    constructor(field: string, maxSizeMb: number) {
        super(400, 'FILE_TOO_LARGE', `Field "${field}" exceeds the maximum size of ${maxSizeMb}MB.`);
    }
}

export class InvalidDateRangeError extends AppError {
    constructor() {
        super(400, 'INVALID_DATE_RANGE', 'endDate must be on or after startDate.');
    }
}