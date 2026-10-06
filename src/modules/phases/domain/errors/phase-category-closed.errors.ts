import { AppError } from '../../../../shared/errors/app-error.js';

export class CategoryClosedError extends AppError {
    constructor() {
        super(
            409,
            'CATEGORY_CLOSED',
            'The championship of this category is closed; no new phases can be created. Reopen it first.',
        );
    }
}