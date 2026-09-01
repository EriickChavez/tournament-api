import { DrizzleTournamentRepository } from './infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from './infrastructure/database/drizzle-tournament-member.repository.js';
import { SlugifyGenerator } from './infrastructure/slug/slugify-generator.js';
import { CreateTournamentUseCase } from './application/use-cases/create-tournament.use-case.js';
import { ListUserTournamentsUseCase } from './application/use-cases/list-user-tournaments.use-case.js';
import { ListPublicTournamentsUseCase } from './application/use-cases/list-public-tournaments.use-case.js';
import { GetTournamentUseCase } from './application/use-cases/get-tournament.use-case.js';
import { UpdateTournamentUseCase } from './application/use-cases/update-tournament.use-case.js';
import { DeleteTournamentUseCase } from './application/use-cases/delete-tournament.use-case.js';
import { TournamentController } from './presentation/tournament.controller.js';
import { createTournamentRouter } from './presentation/tournament.routes.js';
import { requireAuth } from '../auth/auth.module.js';
import { DrizzleUserRepository } from '../auth/infrastructure/database/drizzle-user.repository.js';
import { InviteMemberUseCase } from './application/use-cases/invite-member.use-case.js';
import { ListMembersUseCase } from './application/use-cases/list-members.use-case.js';
import { UpdateMemberRoleUseCase } from './application/use-cases/update-member-role.use-case.js';
import { RemoveMemberUseCase } from './application/use-cases/remove-member.use-case.js';
import { MemberController } from './presentation/member.controller.js';
import { createMemberRouter } from './presentation/member.routes.js';

const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const slugGenerator = new SlugifyGenerator();

const createTournamentUseCase = new CreateTournamentUseCase(
    tournamentRepository,
    tournamentMemberRepository,
    slugGenerator,
);
const listUserTournamentsUseCase = new ListUserTournamentsUseCase(tournamentRepository);
const listPublicTournamentsUseCase = new ListPublicTournamentsUseCase(tournamentRepository);
const getTournamentUseCase = new GetTournamentUseCase(
    tournamentRepository,
    tournamentMemberRepository,
);
const updateTournamentUseCase = new UpdateTournamentUseCase(
    tournamentRepository,
    tournamentMemberRepository,
    slugGenerator,
);
const deleteTournamentUseCase = new DeleteTournamentUseCase(
    tournamentRepository,
    tournamentMemberRepository,
);

const tournamentController = new TournamentController(
    createTournamentUseCase,
    listUserTournamentsUseCase,
    listPublicTournamentsUseCase,
    getTournamentUseCase,
    updateTournamentUseCase,
    deleteTournamentUseCase,
);

const userRepository = new DrizzleUserRepository();

const inviteMemberUseCase = new InviteMemberUseCase(tournamentRepository, tournamentMemberRepository, userRepository);
const listMembersUseCase = new ListMembersUseCase(tournamentMemberRepository);
const updateMemberRoleUseCase = new UpdateMemberRoleUseCase(tournamentMemberRepository);
const removeMemberUseCase = new RemoveMemberUseCase(tournamentMemberRepository);

const memberController = new MemberController(
    inviteMemberUseCase,
    listMembersUseCase,
    updateMemberRoleUseCase,
    removeMemberUseCase,
);

export const memberRouter = createMemberRouter(memberController, requireAuth);
export const tournamentRouter = createTournamentRouter(tournamentController, requireAuth);
