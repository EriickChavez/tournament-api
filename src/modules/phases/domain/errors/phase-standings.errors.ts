import { AppError } from '../../../../shared/errors/app-error.js';

export class StandingsNotAvailableError extends AppError {
    constructor() {
        super(
            400,
            'STANDINGS_NOT_AVAILABLE',
            'Standings by group are only available for phases of type "group".',
        );
    }
}

export class TeamNotInPhaseError extends AppError {
    constructor() {
        super(400, 'TEAM_NOT_IN_PHASE', 'One or more teams are not part of this phase.');
    }
}

export class DuplicateManualRankError extends AppError {
    constructor() {
        super(
            400,
            'DUPLICATE_MANUAL_RANK',
            'Each team can appear once, and a rank number cannot be repeated within the same group (or among best-next teams).',
        );
    }
}

export class PhaseAlreadyClosedError extends AppError {
    constructor() {
        super(409, 'PHASE_ALREADY_CLOSED', 'This phase is already closed.');
    }
}

export class PhaseNotClosedError extends AppError {
    constructor() {
        super(409, 'PHASE_NOT_CLOSED', 'This phase is not closed.');
    }
}

export class PhaseNotCompleteError extends AppError {
    constructor(finished: number, expected: number) {
        super(
            409,
            'PHASE_NOT_COMPLETE',
            `Not all group matches are finished (${finished} of ${expected}).`,
        );
    }
}

export class PhaseHasPendingTiesError extends AppError {
    constructor() {
        super(
            409,
            'PHASE_HAS_PENDING_TIES',
            'There are unresolved ties that affect who qualifies. Resolve them before closing the phase.',
        );
    }
}

export class InvalidQualificationConfigError extends AppError {
    constructor(message: string) {
        super(400, 'INVALID_QUALIFICATION_CONFIG', message);
    }
}