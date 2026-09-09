import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getAllLaunchers,
  getLauncherById,
  createLauncher,
  updateLauncher,
  deleteLauncher,
} from '../services/launcher.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const groupIdQuery = req.query.launchers_group_id ?? req.query.groupId;
    const groupId = groupIdQuery !== undefined ? Number(groupIdQuery) : undefined;

    if (groupId !== undefined && Number.isNaN(groupId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid groupId filter' });
      return;
    }

    const launchers = await getAllLaunchers(groupId);
    res.status(StatusCodes.OK).json({ status: 'ok', data: launchers });
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

    const launcher = await getLauncherById(id);
    if (!launcher) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launcher not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', data: launcher });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await createLauncher(req.body);
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

    const updated = await updateLauncher(id, req.body);
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launcher not found' });
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

    const deleted = await deleteLauncher(id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launcher not found' });
      return;
    }
    res.status(StatusCodes.OK).json({ status: 'ok', message: 'Launcher deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
