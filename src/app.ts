import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './shared/errors/error-handler.js';
import { authRouter } from './modules/auth/auth.module.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRouter);

app.use(errorHandler);

export default app;