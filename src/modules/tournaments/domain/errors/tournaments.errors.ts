import { AppError } from '../../../../shared/errors/app-error.js';

export class SlugAlreadyInUseError extends AppError {
    constructor(slug: string) {
        super(409, 'SLUG_ALREADY_IN_USE', `The slug "${slug}" is already in use.`);
    }
}

export class TournamentNotFoundError extends AppError {
    constructor() {
        super(404, 'TOURNAMENT_NOT_FOUND', 'Tournament not found.');
    }
}

export class NotTournamentOwnerError extends AppError {
    constructor() {
        super(403, 'NOT_TOURNAMENT_OWNER', 'Only the tournament owner can perform this action.');
    }
}

export class NotTournamentOwnerOrAdminError extends AppError {
    constructor() {
        super(
            403,
            'NOT_TOURNAMENT_OWNER_OR_ADMIN',
            'Only the tournament owner or admin can perform this action.',
        );
    }
}