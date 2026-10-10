import { AppError } from '../../../../shared/errors/app-error.js';

export class CategoryStartedError extends AppError {
    constructor() {
        super(
            409,
            'CATEGORY_STARTED',
            'This category has already started (it has matches in progress or finished), so teams and players can no longer be added, moved or removed.',
        );
    }
}

export class CategoryFinishedError extends AppError {
    constructor() {
        super(
            409,
            'CATEGORY_FINISHED',
            'The championship of this category is closed, so its teams and players can no longer be changed. Reopen the championship first.',
        );
    }
}