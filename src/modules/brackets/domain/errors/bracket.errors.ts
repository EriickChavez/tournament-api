import { AppError } from '../../../../shared/errors/app-error.js';

export class InvalidBracketPhaseError extends AppError {
    constructor(message: string) {
        super(400, 'INVALID_BRACKET_PHASE', message);
    }
}

export class SourcePhaseNotClosedError extends AppError {
    constructor() {
        super(
            409,
            'SOURCE_PHASE_NOT_CLOSED',
            'The source phase must be closed before generating the bracket.',
        );
    }
}

export class NotEnoughQualifiedTeamsError extends AppError {
    constructor() {
        super(
            400,
            'NOT_ENOUGH_QUALIFIED_TEAMS',
            'At least 2 qualified teams are needed to generate a bracket.',
        );
    }
}

export class BracketInProgressError extends AppError {
    constructor() {
        super(
            409,
            'BRACKET_IN_PROGRESS',
            'The bracket already has scheduled matches or results, so it cannot be regenerated.',
        );
    }
}

export class BracketNodeNotFoundError extends AppError {
    constructor() {
        super(404, 'BRACKET_NODE_NOT_FOUND', 'Bracket node not found.');
    }
}

export class BracketNodeNotReadyError extends AppError {
    constructor() {
        super(
            409,
            'BRACKET_NODE_NOT_READY',
            'Both teams of this matchup must be known before scheduling the match.',
        );
    }
}

export class BracketNodeAlreadyScheduledError extends AppError {
    constructor() {
        super(409, 'BRACKET_NODE_ALREADY_SCHEDULED', 'This matchup already has a scheduled match.');
    }
}

export class BracketAdvanceConflictError extends AppError {
    constructor() {
        super(
            409,
            'BRACKET_ADVANCE_CONFLICT',
            'This change would alter the result of a matchup that already feeds a scheduled match. Delete or reschedule the next match first.',
        );
    }
}

export class BracketMatchTeamsLockedError extends AppError {
    constructor() {
        super(
            409,
            'BRACKET_MATCH_TEAMS_LOCKED',
            'The teams of a bracket match cannot be changed.',
        );
    }
}

export class BracketLegNotAvailableError extends AppError {
    constructor() {
        super(409, 'BRACKET_LEG_NOT_AVAILABLE', 'This matchup is played in a single leg.');
    }
}

export class BracketFirstLegRequiredError extends AppError {
    constructor() {
        super(409, 'BRACKET_FIRST_LEG_REQUIRED', 'Schedule the first leg before the second leg.');
    }
}

export class SecondLegBeforeFirstError extends AppError {
    constructor() {
        super(400, 'SECOND_LEG_BEFORE_FIRST', 'The second leg must be scheduled after the first leg.');
    }
}

export class BracketPenaltiesNotApplicableError extends AppError {
    constructor() {
        super(
            409,
            'BRACKET_PENALTIES_NOT_APPLICABLE',
            'Penalties only apply when both legs are finished and the aggregate score is tied.',
        );
    }
}