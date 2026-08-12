import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { errorHandler } from './shared/errors/error-handler.js';
import { authRouter } from './modules/auth/auth.module.js';
import { healthRouter } from './shared/health/health.route.js';
import { env } from './config/env.js';
import { logger } from './shared/logging/logger.js';

const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
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

app.use(errorHandler);

export default app;