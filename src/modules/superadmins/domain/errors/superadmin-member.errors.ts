import { AppError } from '../../../../shared/errors/app-error.js';

export class MemberAlreadyExistsError extends AppError {
    constructor() { super(409, 'MEMBER_ALREADY_EXISTS', 'Este usuario ya pertenece a ese torneo.'); }
}