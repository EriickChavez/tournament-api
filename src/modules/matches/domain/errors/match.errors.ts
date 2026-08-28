import { AppError } from '../../../../shared/errors/app-error.js';

export class MatchNotFoundError extends AppError {
    constructor() {
        super(404, 'MATCH_NOT_FOUND', 'Match not found.');
    }
}

export class InvalidCategoryForMatchError extends AppError {
    constructor() {
        super(
            400,
            'INVALID_CATEGORY',
            'The category does not exist or does not belong to this tournament.',
        );
    }
}

export class InvalidTeamForMatchError extends AppError {
    constructor() {
        super(
            400,
            'INVALID_TEAM',
            'One or both teams do not exist, do not belong to this tournament, or do not match the category.',
        );
    }
}

export class SameTeamMatchError extends AppError {
    constructor() {
        super(400, 'SAME_TEAM_MATCH', 'Home and away teams must be different.');
    }
}

export class InvalidMatchStatusError extends AppError {
    constructor(status: string) {
        super(400, 'INVALID_MATCH_STATUS', `Invalid match status: "${status}".`);
    }
}