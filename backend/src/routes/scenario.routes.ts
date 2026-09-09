import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getAllScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario,
} from '../services/scenario.service';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const scenarios = await getAllScenarios();
    res.status(StatusCodes.OK).json({ status: 'ok', data: scenarios });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const scenario = await getScenarioById(req.params.id);
    if (!scenario) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Scenario not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', data: scenario });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await createScenario(req.body);
    res.status(StatusCodes.CREATED).json({ status: 'ok', data: created });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updated = await updateScenario(req.params.id, req.body);
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Scenario not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteScenario(req.params.id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Scenario not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', message: 'Scenario deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
