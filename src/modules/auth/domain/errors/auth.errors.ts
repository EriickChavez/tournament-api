import { AppError } from '../../../../shared/errors/app-error.js';

export class EmailAlreadyInUseError extends AppError {
    constructor(email: string) {
        super(409, 'EMAIL_ALREADY_IN_USE', `The email ${email} is already registered.`);
    }
}

export class InvalidCredentialsError extends AppError {
    constructor() {
        super(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }
}

export class AccountSuspendedError extends AppError {
    constructor() {
        super(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended.');
    }
}

export class UserNotFoundError extends AppError {
    constructor() {
        super(404, 'USER_NOT_FOUND', 'No user found with that email.');
    }
}