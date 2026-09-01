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

export class NotTournamentMemberError extends AppError {
    constructor() {
        super(403, 'NOT_TOURNAMENT_MEMBER', 'You are not a member of this tournament.');
    }
}
export class AlreadyTournamentMemberError extends AppError {
    constructor() {
        super(409, 'ALREADY_TOURNAMENT_MEMBER', 'This user is already a member of the tournament.');
    }
}

export class MemberNotFoundError extends AppError {
    constructor() {
        super(404, 'MEMBER_NOT_FOUND', 'Membership not found.');
    }
}

export class TargetUserNotFoundError extends AppError {
    constructor() {
        super(404, 'TARGET_USER_NOT_FOUND', 'The user to invite was not found.');
    }
}

export class CannotModifyOwnerError extends AppError {
    constructor() {
        super(403, 'CANNOT_MODIFY_OWNER', 'The tournament owner cannot be modified or removed.');
    }
}