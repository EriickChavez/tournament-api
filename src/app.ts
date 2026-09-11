import { join } from 'node:path';
import express from 'express';
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

app.use(healthRouter);
app.use('/auth', authRouter);
app.use('/tournaments', tournamentRouter);
app.use('/tournaments/:tournamentId/categories', tournamentCategoryRouter);
app.use('/categories', categoryRouter);
app.use('/tournaments/:tournamentId/teams', tournamentTeamRouter);
app.use('/teams', teamRouter);
app.use('/teams/:teamId/players', teamPlayersRouter);
app.use('/tournaments/:tournamentId/players', tournamentPlayerRouter);
app.use('/players', playerRouter);
app.use('/tournaments/:tournamentId/matches', tournamentMatchRouter);
app.use('/matches', matchRouter);
app.use('/matches/:matchId/events', matchEventRouter);
app.use('/match-events', standaloneMatchEventRouter);
app.use('/tournaments/:tournamentId/categories/:categoryId', standingsRouter);
app.use('/tournaments/:tournamentId/members', memberRouter);
app.use('/users', userLookupRouter);
app.use('/tournaments/:id/branding', brandingRouter);
app.use('/branding', express.static(join(process.cwd(), 'public', 'branding')));
app.use('/sponsors', publicAppSponsorRouter);
app.use('/uploads/app-sponsors', express.static(join(process.cwd(), 'public', 'app-sponsors')));

app.use('/superadmin', superAdminRouter);
app.use('/superadmin/app-sponsors', adminAppSponsorRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;