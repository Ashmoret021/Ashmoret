import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { checkDatabaseHealth } from '../services/health.service';

const router = Router();

router.get('/health', async (_req, res, next) => {
  try {
    const isHealthy = await checkDatabaseHealth();

    if (!isHealthy) {
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ status: 'error', db: 'disconnected' });
      return;
    }

    res.status(StatusCodes.OK).json({ status: 'ok', db: 'connected' });
  } catch (err) {
    next(err);
  }
});

export default router;
