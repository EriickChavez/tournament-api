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