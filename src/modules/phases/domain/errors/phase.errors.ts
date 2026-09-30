import { AppError } from '../../../../shared/errors/app-error.js';

export class PhaseNotFoundError extends AppError {
    constructor() {
        super(404, 'PHASE_NOT_FOUND', 'Phase not found.');
    }
}

export class PhaseGroupNotFoundError extends AppError {
    constructor() {
        super(404, 'PHASE_GROUP_NOT_FOUND', 'Phase group not found.');
    }
}

export class PhaseGroupNotAllowedError extends AppError {
    constructor() {
        super(400, 'PHASE_GROUP_NOT_ALLOWED', 'Groups are only allowed on phases of type "group".');
    }
}

export class InvalidPhaseDateRangeError extends AppError {
    constructor() {
        super(400, 'INVALID_PHASE_DATE_RANGE', 'End date must be greater than or equal to start date.');
    }
}

export class TeamNotInCategoryError extends AppError {
    constructor() {
        super(400, 'TEAM_NOT_IN_CATEGORY', 'One or more teams do not belong to this category.');
    }
}

export class DuplicatePhaseTeamError extends AppError {
    constructor() {
        super(409, 'DUPLICATE_PHASE_TEAM', 'A team can only be assigned once per phase.');
    }
}

export class PhaseHasMatchesError extends AppError {
    constructor() {
        super(409, 'PHASE_HAS_MATCHES', 'Cannot delete a phase that still has matches. Remove or reassign matches first.');
    }
}