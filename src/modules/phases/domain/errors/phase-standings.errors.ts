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