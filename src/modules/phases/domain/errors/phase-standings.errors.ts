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