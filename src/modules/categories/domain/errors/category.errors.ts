import { AppError } from '../../../../shared/errors/app-error.js';

export class CategoryNotFoundError extends AppError {
    constructor() {
        super(404, 'CATEGORY_NOT_FOUND', 'Category not found.');
    }
}

export class InvalidAgeRangeError extends AppError {
    constructor() {
        super(400, 'INVALID_AGE_RANGE', 'Maximum age must be greater than or equal to minimum age.');
    }
}
