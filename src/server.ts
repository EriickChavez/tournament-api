import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/logging/logger.js';
import { pool } from './config/database.js';

process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception — shutting down');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled rejection — shutting down');
    process.exit(1);
});

const server = app.listen(env.PORT, () => {
    logger.info(`Tournament API running on port ${env.PORT}`);
});

function shutdown(signal: string): void {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
        void pool.end().then(() => {
            logger.info('Database pool closed');
            process.exit(0);
        });
    });
    setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));