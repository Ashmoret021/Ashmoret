import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getAllDroneTypes,
  getDroneTypeById,
  createDroneType,
  updateDroneType,
  deleteDroneType,
} from '../services/drone-type.service';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const types = await getAllDroneTypes();
    res.status(StatusCodes.OK).json({ status: 'ok', data: types });
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

    const item = await getDroneTypeById(id);
    if (!item) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Drone type not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', data: item });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await createDroneType(req.body);
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

    const updated = await updateDroneType(id, req.body);
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Drone type not found' });
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

    const deleted = await deleteDroneType(id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Drone type not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', message: 'Drone type deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
