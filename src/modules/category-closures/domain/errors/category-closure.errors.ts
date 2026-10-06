import { AppError } from '../../../../shared/errors/app-error.js';

export class ChampionNotDecidedError extends AppError {
    constructor() {
        super(
            409,
            'CHAMPION_NOT_DECIDED',
            'The championship cannot be closed until the final has a winner.',
        );
    }
}

export class CategoryAlreadyClosedError extends AppError {
    constructor() {
        super(409, 'CATEGORY_ALREADY_CLOSED', 'This category championship is already closed.');
    }
}

export class CategoryNotClosedError extends AppError {
    constructor() {
        super(409, 'CATEGORY_NOT_CLOSED', 'This category championship is not closed.');
    }
}