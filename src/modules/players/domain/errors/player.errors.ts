import { AppError } from '../../../../shared/errors/app-error.js';

export class PlayerNotFoundError extends AppError {
    constructor() {
        super(404, 'PLAYER_NOT_FOUND', 'Player not found.');
    }
}

export class JerseyNumberAlreadyInUseError extends AppError {
    constructor(number: number) {
        super(
            409,
            'JERSEY_NUMBER_ALREADY_IN_USE',
            `Jersey number ${number} is already in use in this tournament.`,
        );
    }
}

export class InvalidCategoryForPlayerError extends AppError {
    constructor() {
        super(
            400,
            'INVALID_CATEGORY',
            'The category does not exist or does not belong to this tournament.',
        );
    }
}

export class InvalidTeamForPlayerError extends AppError {
    constructor() {
        super(
            400,
            'INVALID_TEAM',
            'The team does not exist, does not belong to this tournament, or does not match the category.',
        );
    }
}