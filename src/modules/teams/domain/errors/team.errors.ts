import { AppError } from '../../../../shared/errors/app-error.js';

export class TeamNotFoundError extends AppError {
    constructor() {
        super(404, 'TEAM_NOT_FOUND', 'Team not found.');
    }
}

export class TeamNameAlreadyInUseError extends AppError {
    constructor(name: string) {
        super(409, 'TEAM_NAME_ALREADY_IN_USE', `A team named "${name}" already exists in this tournament.`);
    }
}

export class InvalidCategoryForTeamError extends AppError {
    constructor() {
        super(400, 'INVALID_CATEGORY', 'The category does not exist or does not belong to this tournament.');
    }
}