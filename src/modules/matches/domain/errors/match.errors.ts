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

export class InvalidPhaseForMatchError extends AppError {
    constructor() {
        super(
            400,
            'INVALID_PHASE',
            'The phase does not exist or does not belong to this category.',
        );
    }
}

export class InvalidPhaseGroupForMatchError extends AppError {
    constructor() {
        super(
            400,
            'INVALID_PHASE_GROUP',
            'The phase group does not exist or does not belong to this phase.',
        );
    }
}

export class MatchNotInProgressError extends AppError {
    constructor() {
        super(
            409,
            'MATCH_NOT_IN_PROGRESS',
            'Match events can only be registered or removed while the match is in progress.',
        );
    }
}

export class InvalidMatchTransitionError extends AppError {
    constructor(from: string, to: string) {
        super(409, 'INVALID_MATCH_TRANSITION', `Cannot change a match from "${from}" to "${to}".`);
    }
}

export class UseLifecycleEndpointsError extends AppError {
    constructor() {
        super(
            400,
            'USE_LIFECYCLE_ENDPOINTS',
            'Use POST /matches/:id/start, /finish or /reopen to change the match to or from in_progress/finished.',
        );
    }
}

export class MatchHasEventsError extends AppError {
    constructor() {
        super(
            409,
            'MATCH_HAS_EVENTS',
            'Teams or category cannot be changed while the match has registered events.',
        );
    }
}