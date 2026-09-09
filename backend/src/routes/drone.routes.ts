import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getAllDrones,
  getDroneById,
  createDrone,
  updateDrone,
  deleteDrone,
} from '../services/drone.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const groupIdQuery = req.query.drones_group_id ?? req.query.groupId;
    const groupId = groupIdQuery !== undefined ? Number(groupIdQuery) : undefined;

    if (groupId !== undefined && Number.isNaN(groupId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid groupId filter' });
      return;
    }

    const drones = await getAllDrones(groupId);
    res.status(StatusCodes.OK).json({ status: 'ok', data: drones });
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

    const drone = await getDroneById(id);
    if (!drone) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Drone not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', data: drone });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await createDrone(req.body);
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

    const updated = await updateDrone(id, req.body);
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Drone not found' });
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

    const deleted = await deleteDrone(id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Drone not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', message: 'Drone deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
