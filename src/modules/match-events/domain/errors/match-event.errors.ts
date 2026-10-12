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

export class InvalidSubstitutionError extends AppError {
    constructor() {
        super(
            400,
            'INVALID_SUBSTITUTION',
            'A "cambio" needs the player leaving (playerId) and the player entering (substitutePlayerId), different players of the same team. The substitute can only be set on "cambio" events.',
        );
    }
}

export class InvalidOccurredAtError extends AppError {
    constructor() {
        super(400, 'INVALID_OCCURRED_AT', 'occurredAt cannot be in the future.');
    }
}

export class PlayerAlreadySentOffError extends AppError {
    constructor() {
        super(409, 'PLAYER_ALREADY_SENT_OFF', 'This player was already sent off in this match.');
    }
}

export class DerivedMatchEventError extends AppError {
    constructor() {
        super(
            409,
            'DERIVED_MATCH_EVENT',
            'This event was generated automatically (double yellow). Delete the second yellow card instead.',
        );
    }
}

export class InvalidMatchEventUpdateError extends AppError {
    constructor(message: string) {
        super(400, 'INVALID_EVENT_UPDATE', message);
    }
}