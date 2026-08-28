import { AppError } from '../../../../shared/errors/app-error.js';

export class MatchEventNotFoundError extends AppError {
    constructor() {
        super(404, 'MATCH_EVENT_NOT_FOUND', 'Match event not found.');
    }
}

export class InvalidTeamForMatchEventError extends AppError {
    constructor() {
        super(400, 'INVALID_TEAM_FOR_EVENT', 'The team must be one of the two teams playing this match.');
    }
}

export class InvalidPlayerForMatchEventError extends AppError {
    constructor() {
        super(400, 'INVALID_PLAYER_FOR_EVENT', 'The player does not belong to the specified team.');
    }
}

export class InvalidAssistForMatchEventError extends AppError {
    constructor() {
        super(400, 'INVALID_ASSIST_FOR_EVENT', 'An assist can only be set for a "gol" event.');
    }
}
