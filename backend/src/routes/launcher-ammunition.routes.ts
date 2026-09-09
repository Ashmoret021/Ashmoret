import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getAllLauncherAmmunition,
  getLauncherAmmunitionById,
  createLauncherAmmunition,
  updateLauncherAmmunition,
  deleteLauncherAmmunition,
} from '../services/launcher-ammunition.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const launcherIdParam = req.query.launcher_id ?? req.query.launcherId;
    const interceptorTypeIdParam = req.query.interceptor_type_id ?? req.query.interceptorTypeId;

    const launcherId = launcherIdParam !== undefined ? Number(launcherIdParam) : undefined;
    const interceptorTypeId =
      interceptorTypeIdParam !== undefined ? Number(interceptorTypeIdParam) : undefined;

    if (launcherId !== undefined && Number.isNaN(launcherId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid launcherId' });
      return;
    }
    if (interceptorTypeId !== undefined && Number.isNaN(interceptorTypeId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid interceptorTypeId' });
      return;
    }

    const ammunitions = await getAllLauncherAmmunition(launcherId, interceptorTypeId);
    res.status(StatusCodes.OK).json({ status: 'ok', data: ammunitions });
  } catch (err) {
    next(err);
  }
});

router.get('/:launcherId/:interceptorTypeId', async (req, res, next) => {
  try {
    const launcherId = Number(req.params.launcherId);
    const interceptorTypeId = Number(req.params.interceptorTypeId);

    if (Number.isNaN(launcherId) || Number.isNaN(interceptorTypeId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid ID parameters' });
      return;
    }

    const item = await getLauncherAmmunitionById(launcherId, interceptorTypeId);
    if (!item) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launcher ammunition record not found' });
      return;
    }

    res.status(StatusCodes.OK).json({ status: 'ok', data: item });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const created = await createLauncherAmmunition(req.body);
    res.status(StatusCodes.CREATED).json({ status: 'ok', data: created });
  } catch (err) {
    next(err);
  }
});

router.put('/:launcherId/:interceptorTypeId', async (req, res, next) => {
  try {
    const launcherId = Number(req.params.launcherId);
    const interceptorTypeId = Number(req.params.interceptorTypeId);

    if (Number.isNaN(launcherId) || Number.isNaN(interceptorTypeId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid ID parameters' });
      return;
    }

    const updated = await updateLauncherAmmunition(launcherId, interceptorTypeId, req.body);
    if (!updated) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launcher ammunition record not found' });
      return;
    }

    res.status(StatusCodes.OK).json({ status: 'ok', data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:launcherId/:interceptorTypeId', async (req, res, next) => {
  try {
    const launcherId = Number(req.params.launcherId);
    const interceptorTypeId = Number(req.params.interceptorTypeId);

    if (Number.isNaN(launcherId) || Number.isNaN(interceptorTypeId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: 'Invalid ID parameters' });
      return;
    }

    const deleted = await deleteLauncherAmmunition(launcherId, interceptorTypeId);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Launcher ammunition record not found' });
      return;
    }

    res.status(StatusCodes.OK).json({ status: 'ok', message: 'Launcher ammunition record deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
