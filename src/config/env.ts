const requiredEnv = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 3000),
    DATABASE_URL: process.env.DATABASE_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
} as const;

if (!requiredEnv.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

export const env = requiredEnv;