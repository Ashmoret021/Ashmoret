import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  createAttackSide,
  deleteAttackSide,
  getAllAttackSides,
  getAttackSideById,
  updateAttackSide,
} from '../services/attackSide.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const scenarioId = typeof req.query.scenario_id === 'string' ? req.query.scenario_id : undefined;
    const attackSides = await getAllAttackSides(scenarioId);
    res.status(StatusCodes.OK).json({ status: 'ok', data: attackSides });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid ID format' });
      return;
    }

    const attackSide = await getAttackSideById(id);
    if (!attackSide) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Attack side not found' });
      return;
    }

    res.status(StatusCodes.OK).json({ status: 'ok', data: attackSide });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await createAttackSide(req.body);
    res.status(StatusCodes.CREATED).json({ status: 'ok', data: created });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid ID format' });
      return;
    }

    const updated = await updateAttackSide(id, req.body);
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Attack side not found' });
      return;
    }

    res.status(StatusCodes.OK).json({ status: 'ok', data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid ID format' });
      return;
    }

    const deleted = await deleteAttackSide(id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Attack side not found' });
      return;
    }

    res.status(StatusCodes.OK).json({ status: 'ok', message: 'Attack side deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
