import { Router } from 'express';
import { pool } from '../../config/database.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok', database: 'up' });
    } catch {
        res.status(503).json({ status: 'error', database: 'down' });
    }
});
