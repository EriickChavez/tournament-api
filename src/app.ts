import { join } from 'node:path';
import express, { Router } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { errorHandler } from './shared/errors/error-handler.js';
import { authRouter, userLookupRouter } from './modules/auth/auth.module.js';
import { healthRouter } from './shared/health/health.route.js';
import { env } from './config/env.js';
import { logger } from './shared/logging/logger.js';
import { memberRouter, tournamentRouter } from './modules/tournaments/tournaments.module.js';
import {
    categoryRouter,
    tournamentCategoryRouter,
} from './modules/categories/categories.module.js';
import { teamRouter, tournamentTeamRouter } from './modules/teams/teams.module.js';
import { playerRouter, tournamentPlayerRouter, teamPlayersRouter } from './modules/players/players.module.js';
import { matchRouter, tournamentMatchRouter } from './modules/matches/matches.module.js';
import { matchEventRouter, standaloneMatchEventRouter } from './modules/match-events/match-events.module.js';
import { standingsRouter } from './modules/standings/standings.module.js';
import { superAdminRouter } from './modules/superadmins/superadmins.module.js';
import { brandingRouter } from './modules/branding/branding.module.js';
import { notFoundHandler } from './shared/errors/not-found.middleware.js';
import {
    adminAppSponsorRouter,
    publicAppSponsorRouter,
} from './modules/app-sponsors/app-sponsors.module.js';
import { tournamentSponsorRouter } from './modules/tournament-sponsors/tournament-sponsors.module.js';
import {
    tournamentCategoryPhaseRouter,
    phaseRouter,
    phaseGroupRouter,
} from './modules/phases/phases.module.js';
import {
    phaseStandingsRouter,
    phaseClosureRouter,
} from './modules/phases/phase-standings.module.js';
import { bracketRouter } from './modules/brackets/brackets.module.js';
import { categoryClosureRouter } from './modules/category-closures/category-closures.module.js';
import { competitionStateRouter } from './modules/competition-state/competition-state.module.js';
import { tournamentImportRouter } from './modules/imports/imports.module.js';

const app = express();

app.use(pinoHttp({ logger }));
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
);
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Fuera de la API versionada: infraestructura y archivos estáticos (sus URLs ya están guardadas en la base).
app.use(healthRouter);
app.use('/branding', express.static(join(process.cwd(), 'public', 'branding')));
app.use('/uploads/app-sponsors', express.static(join(process.cwd(), 'public', 'app-sponsors')));
app.use(
    '/uploads/tournament-sponsors',
    express.static(join(process.cwd(), 'public', 'tournament-sponsors')),
);

// API versionada. Dentro de v1 solo se agregan campos y endpoints; lo que rompa el contrato va en /v2.
const v1 = Router();
v1.use((_req, res, next) => {
    res.setHeader('X-API-Version', '1');
    next();
});

v1.use('/auth', authRouter);
v1.use('/tournaments', tournamentRouter);
v1.use('/tournaments/:tournamentId/categories', tournamentCategoryRouter);
v1.use('/categories', categoryRouter);
v1.use('/tournaments/:tournamentId/teams', tournamentTeamRouter);
v1.use('/teams', teamRouter);
v1.use('/teams/:teamId/players', teamPlayersRouter);
v1.use('/tournaments/:tournamentId/players', tournamentPlayerRouter);
v1.use('/players', playerRouter);
v1.use('/tournaments/:tournamentId/import', tournamentImportRouter);
v1.use('/tournaments/:tournamentId/matches', tournamentMatchRouter);
v1.use('/matches', matchRouter);
v1.use('/matches/:matchId/events', matchEventRouter);
v1.use('/match-events', standaloneMatchEventRouter);
v1.use('/tournaments/:tournamentId/categories/:categoryId', standingsRouter);
v1.use(
    '/tournaments/:tournamentId/categories/:categoryId/phases',
    tournamentCategoryPhaseRouter,
);
v1.use('/tournaments/:tournamentId', categoryClosureRouter);
v1.use('/tournaments/:tournamentId', competitionStateRouter);
v1.use('/phases', phaseRouter);
v1.use('/phases/:phaseId/standings', phaseStandingsRouter);
v1.use('/phases/:phaseId/bracket', bracketRouter);
v1.use('/phases/:phaseId', phaseClosureRouter);
v1.use('/phase-groups', phaseGroupRouter);
v1.use('/tournaments/:tournamentId/members', memberRouter);
v1.use('/users', userLookupRouter);
v1.use('/tournaments/:id/branding', brandingRouter);
v1.use('/sponsors', publicAppSponsorRouter);

// Tournament sponsors
v1.use('/tournaments/:tournamentId/sponsors', tournamentSponsorRouter);

v1.use('/superadmin', superAdminRouter);
v1.use('/superadmin/app-sponsors', adminAppSponsorRouter);

app.use('/v1', v1);

// Alias legacy (sin prefijo): mismas rutas que /v1, marcadas como obsoletas.
// Retíralo cuando ningún cliente lo use (el encabezado Deprecation permite detectarlo en los logs).
app.use((req, res, next) => {
    if (!req.path.startsWith('/v1')) res.setHeader('Deprecation', 'true');
    next();
}, v1);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;