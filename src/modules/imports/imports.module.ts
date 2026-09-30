import { DrizzleTournamentImportRepository } from './infrastructure/database/drizzle-tournament-import.repository.js';
import { ExcelJsSpreadsheetParser } from './infrastructure/spreadsheet/exceljs-spreadsheet-parser.js';
import { DrizzleTournamentRepository } from '../tournaments/infrastructure/database/drizzle-tournament.repository.js';
import { DrizzleTournamentMemberRepository } from '../tournaments/infrastructure/database/drizzle-tournament-member.repository.js';
import { DrizzleCategoryRepository } from '../categories/infrastructure/database/drizzle-category.repository.js';
import { ImportTournamentDataUseCase } from './application/use-cases/import-tournament-data.use-case.js';
import { ImportController } from './presentation/import.controller.js';
import { createTournamentImportRouter } from './presentation/import.routes.js';
import { requireAuth } from '../auth/auth.module.js';

const importRepository = new DrizzleTournamentImportRepository();
const spreadsheetParser = new ExcelJsSpreadsheetParser();
const tournamentRepository = new DrizzleTournamentRepository();
const tournamentMemberRepository = new DrizzleTournamentMemberRepository();
const categoryRepository = new DrizzleCategoryRepository();

const importTournamentDataUseCase = new ImportTournamentDataUseCase(
    spreadsheetParser,
    importRepository,
    tournamentRepository,
    tournamentMemberRepository,
    categoryRepository,
);

const importController = new ImportController(importTournamentDataUseCase);

export const tournamentImportRouter = createTournamentImportRouter(importController, requireAuth);