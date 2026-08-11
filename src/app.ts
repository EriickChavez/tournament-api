import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './shared/errors/error-handler.js';
import { authRouter } from './modules/auth/auth.module.js';
import { env } from './config/env.js';

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);

app.use(errorHandler);

export default app;