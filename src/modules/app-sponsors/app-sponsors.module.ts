import { DrizzleAppSponsorRepository } from './infrastructure/database/drizzle-app-sponsor.repository.js';
import { LocalDiskAppSponsorFileStorage } from './infrastructure/storage/local-disk-app-sponsor-file-storage.js';
import { ListPublicAppSponsorsUseCase } from './application/use-cases/list-public-app-sponsors.use-case.js';
import { ListAllAppSponsorsUseCase } from './application/use-cases/list-all-app-sponsors.use-case.js';
import { CreateAppSponsorUseCase } from './application/use-cases/create-app-sponsor.use-case.js';
import { UpdateAppSponsorUseCase } from './application/use-cases/update-app-sponsor.use-case.js';
import { DeleteAppSponsorUseCase } from './application/use-cases/delete-app-sponsor.use-case.js';
import { AppSponsorController } from './presentation/app-sponsor.controller.js';
import {
    createAdminAppSponsorRouter,
    createPublicAppSponsorRouter,
} from './presentation/app-sponsor.routes.js';
import { requireSuperAuth } from '../superadmins/superadmins.module.js';

const fileStorage = new LocalDiskAppSponsorFileStorage();
const appSponsorRepository = new DrizzleAppSponsorRepository();

const listPublicAppSponsorsUseCase = new ListPublicAppSponsorsUseCase(appSponsorRepository);
const listAllAppSponsorsUseCase = new ListAllAppSponsorsUseCase(appSponsorRepository);
const createAppSponsorUseCase = new CreateAppSponsorUseCase(appSponsorRepository, fileStorage);
const updateAppSponsorUseCase = new UpdateAppSponsorUseCase(appSponsorRepository, fileStorage);
const deleteAppSponsorUseCase = new DeleteAppSponsorUseCase(appSponsorRepository, fileStorage);

export const appSponsorController = new AppSponsorController(
    listPublicAppSponsorsUseCase,
    listAllAppSponsorsUseCase,
    createAppSponsorUseCase,
    updateAppSponsorUseCase,
    deleteAppSponsorUseCase,
);

export const publicAppSponsorRouter = createPublicAppSponsorRouter(appSponsorController);
export const adminAppSponsorRouter = createAdminAppSponsorRouter(
    appSponsorController,
    requireSuperAuth,
);