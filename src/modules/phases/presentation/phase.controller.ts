import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/errors/app-error.js';
import { CreatePhaseUseCase } from '../application/use-cases/create-phase.use-case.js';
import { ListPhasesUseCase } from '../application/use-cases/list-phases.use-case.js';
import { GetPhaseUseCase } from '../application/use-cases/get-phase.use-case.js';
import { UpdatePhaseUseCase } from '../application/use-cases/update-phase.use-case.js';
import { DeletePhaseUseCase } from '../application/use-cases/delete-phase.use-case.js';
import { CreatePhaseGroupUseCase } from '../application/use-cases/create-phase-group.use-case.js';
import { ListPhaseGroupsUseCase } from '../application/use-cases/list-phase-groups.use-case.js';
import { UpdatePhaseGroupUseCase } from '../application/use-cases/update-phase-group.use-case.js';
import { DeletePhaseGroupUseCase } from '../application/use-cases/delete-phase-group.use-case.js';
import { SyncPhaseTeamsUseCase } from '../application/use-cases/sync-phase-teams.use-case.js';
import { ListPhaseTeamsUseCase } from '../application/use-cases/list-phase-teams.use-case.js';
import {
    createPhaseSchema,
    updatePhaseSchema,
    createPhaseGroupSchema,
    updatePhaseGroupSchema,
    syncPhaseTeamsSchema,
} from './schemas/phase.schemas.js';
import {
    toPublicPhase,
    toPublicPhaseGroup,
    toPublicPhaseTeam,
} from './utils/public-phase.js';

export class PhaseController {
    constructor(
        private readonly createPhase: CreatePhaseUseCase,
        private readonly listPhases: ListPhasesUseCase,
        private readonly getPhase: GetPhaseUseCase,
        private readonly updatePhase: UpdatePhaseUseCase,
        private readonly deletePhase: DeletePhaseUseCase,
        private readonly createPhaseGroup: CreatePhaseGroupUseCase,
        private readonly listPhaseGroups: ListPhaseGroupsUseCase,
        private readonly updatePhaseGroup: UpdatePhaseGroupUseCase,
        private readonly deletePhaseGroup: DeletePhaseGroupUseCase,
        private readonly syncPhaseTeams: SyncPhaseTeamsUseCase,
        private readonly listPhaseTeams: ListPhaseTeamsUseCase,
    ) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = createPhaseSchema.parse(req.body);
            const phase = await this.createPhase.execute({
                tournamentId: req.params.tournamentId as string,
                categoryId: req.params.categoryId as string,
                userId: req.userId,
                ...body,
            });
            res.status(201).json({ phase: toPublicPhase(phase) });
        } catch (err) {
            next(err);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const phases = await this.listPhases.execute({
                tournamentId: req.params.tournamentId as string,
                categoryId: req.params.categoryId as string,
            });
            res.json({ phases: phases.map(toPublicPhase) });
        } catch (err) {
            next(err);
        }
    };

    get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const phase = await this.getPhase.execute(req.params.id as string);
            res.json({ phase: toPublicPhase(phase) });
        } catch (err) {
            next(err);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = updatePhaseSchema.parse(req.body);
            const phase = await this.updatePhase.execute({
                id: req.params.id as string,
                userId: req.userId,
                ...body,
            });
            res.json({ phase: toPublicPhase(phase) });
        } catch (err) {
            next(err);
        }
    };

    remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            await this.deletePhase.execute({
                id: req.params.id as string,
                userId: req.userId,
            });
            res.json({ message: 'Phase deleted successfully' });
        } catch (err) {
            next(err);
        }
    };

    createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = createPhaseGroupSchema.parse(req.body);
            const group = await this.createPhaseGroup.execute({
                phaseId: req.params.phaseId as string,
                userId: req.userId,
                ...body,
            });
            res.status(201).json({ group: toPublicPhaseGroup(group) });
        } catch (err) {
            next(err);
        }
    };

    listGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const groups = await this.listPhaseGroups.execute(req.params.phaseId as string);
            res.json({ groups: groups.map(toPublicPhaseGroup) });
        } catch (err) {
            next(err);
        }
    };

    updateGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = updatePhaseGroupSchema.parse(req.body);
            const group = await this.updatePhaseGroup.execute({
                id: req.params.id as string,
                userId: req.userId,
                ...body,
            });
            res.json({ group: toPublicPhaseGroup(group) });
        } catch (err) {
            next(err);
        }
    };

    removeGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            await this.deletePhaseGroup.execute({
                id: req.params.id as string,
                userId: req.userId,
            });
            res.json({ message: 'Phase group deleted successfully' });
        } catch (err) {
            next(err);
        }
    };

    syncTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) throw new AppError(401, 'UNAUTHENTICATED', 'No session found.');
            const body = syncPhaseTeamsSchema.parse(req.body);
            const teams = await this.syncPhaseTeams.execute({
                phaseId: req.params.phaseId as string,
                userId: req.userId,
                teams: body.teams,
            });
            res.json({ teams: teams.map(toPublicPhaseTeam) });
        } catch (err) {
            next(err);
        }
    };

    listTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const teams = await this.listPhaseTeams.execute(req.params.phaseId as string);
            res.json({ teams: teams.map(toPublicPhaseTeam) });
        } catch (err) {
            next(err);
        }
    };
}