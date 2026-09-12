import { DrizzleTournamentSponsorRepository } from './infrastructure/database/drizzle-tournament-sponsor.repository.js';
import { LocalDiskTournamentSponsorFileStorage } from './infrastructure/storage/local-disk-tournament-sponsor-file-storage.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { ListPublicTournamentSponsorsUseCase } from './application/use-cases/list-public-tournament-sponsors.use-case.js';
import { ListAdminTournamentSponsorsUseCase } from './application/use-cases/list-admin-tournament-sponsors.use-case.js';
import { CreateTournamentSponsorUseCase } from './application/use-cases/create-tournament-sponsor.use-case.js';
import { UpdateTournamentSponsorUseCase } from './application/use-cases/update-tournament-sponsor.use-case.js';
import { DeleteTournamentSponsorUseCase } from './application/use-cases/delete-tournament-sponsor.use-case.js';
import { TournamentSponsorController } from './presentation/tournament-sponsor.controller.js';
import { createTournamentSponsorRouter } from './presentation/tournament-sponsor.routes.js';
import { requireAuth } from '../auth/auth.module.js';

const fileStorage = new LocalDiskTournamentSponsorFileStorage();
const sponsorRepository = new DrizzleTournamentSponsorRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const memberRepository = new DrizzleTournamentMemberRepository();

const listPublicUseCase = new ListPublicTournamentSponsorsUseCase(sponsorRepository);
const listAdminUseCase = new ListAdminTournamentSponsorsUseCase(sponsorRepository, memberRepository);
const createUseCase = new CreateTournamentSponsorUseCase(
    sponsorRepository,
    tournamentRepository,
    memberRepository,
    fileStorage,
);
const updateUseCase = new UpdateTournamentSponsorUseCase(
    sponsorRepository,
    memberRepository,
    fileStorage,
);
const deleteUseCase = new DeleteTournamentSponsorUseCase(
    sponsorRepository,
    memberRepository,
    fileStorage,
);

const controller = new TournamentSponsorController(
    listPublicUseCase,
    listAdminUseCase,
    createUseCase,
    updateUseCase,
    deleteUseCase,
);

export const tournamentSponsorRouter = createTournamentSponsorRouter(controller, requireAuth);