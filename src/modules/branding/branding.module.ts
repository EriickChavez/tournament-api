import { DrizzleBrandingRepository } from './infrastructure/database/drizzle-branding.repository.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { UpsertTournamentBrandingUseCase } from './application/use-cases/upsert-tournament-branding.use-case.js';
import { GetTournamentBrandingUseCase } from './application/use-cases/get-tournament-branding.use-case.js';
import { BrandingController } from './presentation/branding.controller.js';
import { createBrandingRouter } from './presentation/branding.routes.js';
import { requireAuth } from '../auth/auth.module.js';
import { LocalDiskFileStorage } from './infrastructure/storage/local-disk-file-storage.js';

const fileStorage = new LocalDiskFileStorage();

const brandingRepository = new DrizzleBrandingRepository();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();

const upsertTournamentBrandingUseCase = new UpsertTournamentBrandingUseCase(
    brandingRepository,
    tournamentRepository,
    tournamentMemberRepository,
    fileStorage,
);
const getTournamentBrandingUseCase = new GetTournamentBrandingUseCase(brandingRepository);

export const brandingController = new BrandingController(
    upsertTournamentBrandingUseCase,
    getTournamentBrandingUseCase,
);

export const brandingRouter = createBrandingRouter(brandingController, requireAuth);