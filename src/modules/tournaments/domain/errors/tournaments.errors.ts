import { AppError } from '../../../../shared/errors/app-error';

export class SlugAlreadyInUseError extends AppError {
    constructor(slug: string) {
        super(409, 'SLUG_ALREADY_IN_USE', `The slug "${slug}" is already in use.`);
    }
}