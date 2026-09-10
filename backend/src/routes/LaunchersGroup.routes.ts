import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getAllLaunchersGroups,
  getLaunchersGroupById,
  createLaunchersGroup,
  updateLaunchersGroup,
  deleteLaunchersGroup,
} from '../services/LaunchersGroup.service';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const groups = await getAllLaunchersGroups();
    res.status(StatusCodes.OK).json({ status: 'ok', data: groups });
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

    const group = await getLaunchersGroupById(id);
    if (!group) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launchers group not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', data: group });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await createLaunchersGroup(req.body);
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

    const updated = await updateLaunchersGroup(id, req.body);
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launchers group not found' });
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

    const deleted = await deleteLaunchersGroup(id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launchers group not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', message: 'Launchers group deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
