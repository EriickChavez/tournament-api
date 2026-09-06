import { AppError } from "../../../../../shared/errors/app-error";

export class SuperAdminEmailAlreadyInUseError extends AppError {
    constructor(email: string) {
        super(409, 'SUPERADMIN_EMAIL_ALREADY_IN_USE', `The email ${email} is already registered.`);
    }
}

export class InvalidSuperAdminCredentialsError extends AppError {
    constructor() {
        super(401, 'INVALID_SUPERADMIN_CREDENTIALS', 'Invalid email or password.');
    }
}

export class SuperAdminAccountSuspendedError extends AppError {
    constructor() {
        super(403, 'SUPERADMIN_ACCOUNT_SUSPENDED', 'This superadmin account has been suspended.');
    }
}