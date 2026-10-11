import { AppError } from '../../../../shared/errors/app-error.js';

export class PhaseStructureLockedError extends AppError {
    constructor() {
        super(
            409,
            'PHASE_STRUCTURE_LOCKED',
            'This phase already has matches, so its groups and team assignments can no longer be changed. Delete its matches first.',
        );
    }
}