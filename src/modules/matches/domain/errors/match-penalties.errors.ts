import { AppError } from '../../../../shared/errors/app-error.js';

export class InvalidPenaltiesError extends AppError {
    constructor(message: string) {
        super(400, 'INVALID_PENALTIES', message);
    }
}