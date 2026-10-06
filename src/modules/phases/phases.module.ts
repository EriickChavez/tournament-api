import { DrizzlePhaseRepository, DrizzlePhaseGroupRepository, DrizzlePhaseTeamRepository } from './infrastructure/database/drizzle-phase.repository.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzleCategoryRepository } from '../categories/infrastructure/database/drizzle-category.repository.js';
import { DrizzleTeamRepository } from '../teams/infrastructure/database/drizzle-team.repository.js';
import { DrizzleCategoryClosureRepository } from '../category-closures/infrastructure/database/drizzle-category-closure.repository.js';
import { requireAuth } from '../auth/auth.module.js';

import { CreatePhaseUseCase } from './application/use-cases/create-phase.use-case.js';
import { ListPhasesUseCase } from './application/use-cases/list-phases.use-case.js';
import { GetPhaseUseCase } from './application/use-cases/get-phase.use-case.js';
import { UpdatePhaseUseCase } from './application/use-cases/update-phase.use-case.js';
import { DeletePhaseUseCase } from './application/use-cases/delete-phase.use-case.js';
import { CreatePhaseGroupUseCase } from './application/use-cases/create-phase-group.use-case.js';
import { ListPhaseGroupsUseCase } from './application/use-cases/list-phase-groups.use-case.js';
import { UpdatePhaseGroupUseCase } from './application/use-cases/update-phase-group.use-case.js';
import { DeletePhaseGroupUseCase } from './application/use-cases/delete-phase-group.use-case.js';
import { SyncPhaseTeamsUseCase } from './application/use-cases/sync-phase-teams.use-case.js';
import { ListPhaseTeamsUseCase } from './application/use-cases/list-phase-teams.use-case.js';

import { PhaseController } from './presentation/phase.controller.js';
import { createPhaseRoutes } from './presentation/phase.routes.js';

const phaseRepository = new DrizzlePhaseRepository();
const phaseGroupRepository = new DrizzlePhaseGroupRepository();
const phaseTeamRepository = new DrizzlePhaseTeamRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const categoryRepository = new DrizzleCategoryRepository();
const teamRepository = new DrizzleTeamRepository();
// Solo se usa para saber si el campeonato de una categoría está cerrado.
const categoryClosureRepository = new DrizzleCategoryClosureRepository();

const createPhase = new CreatePhaseUseCase(
    phaseRepository,
    tournamentRepository,
    tournamentMemberRepository,
    categoryRepository,
    categoryClosureRepository,
);
const listPhases = new ListPhasesUseCase(
    phaseRepository,
    categoryRepository,
    tournamentRepository,
);
const getPhase = new GetPhaseUseCase(phaseRepository);
const updatePhase = new UpdatePhaseUseCase(phaseRepository, tournamentMemberRepository);
const deletePhase = new DeletePhaseUseCase(phaseRepository, tournamentMemberRepository);

const createPhaseGroup = new CreatePhaseGroupUseCase(
    phaseRepository,
    phaseGroupRepository,
    tournamentMemberRepository,
);
const listPhaseGroups = new ListPhaseGroupsUseCase(phaseRepository, phaseGroupRepository);
const updatePhaseGroup = new UpdatePhaseGroupUseCase(
    phaseRepository,
    phaseGroupRepository,
    tournamentMemberRepository,
);
const deletePhaseGroup = new DeletePhaseGroupUseCase(
    phaseRepository,
    phaseGroupRepository,
    tournamentMemberRepository,
);

const syncPhaseTeams = new SyncPhaseTeamsUseCase(
    phaseRepository,
    phaseGroupRepository,
    phaseTeamRepository,
    teamRepository,
    tournamentMemberRepository,
);
const listPhaseTeams = new ListPhaseTeamsUseCase(phaseRepository, phaseTeamRepository);

const controller = new PhaseController(
    createPhase,
    listPhases,
    getPhase,
    updatePhase,
    deletePhase,
    createPhaseGroup,
    listPhaseGroups,
    updatePhaseGroup,
    deletePhaseGroup,
    syncPhaseTeams,
    listPhaseTeams,
);

export const {
    tournamentCategoryPhaseRouter,
    phaseRouter,
    phaseGroupRouter,
} = createPhaseRoutes(controller, requireAuth);