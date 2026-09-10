import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
  getAllLauncherTypes,
  getLauncherTypeById,
  createLauncherType,
  updateLauncherType,
  deleteLauncherType,
} from "../services/LauncherType.service";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const types = await getAllLauncherTypes();
    res.status(StatusCodes.OK).json(types);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json("Invalid ID format");
      return;
    }

    const item = await getLauncherTypeById(id);
    if (!item) {
      res.status(StatusCodes.NOT_FOUND).json("Launcher type not found");
      return;
    }
    res.status(StatusCodes.OK).json(item);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const created = await createLauncherType(req.body);
    res.status(StatusCodes.CREATED).json(created);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json("Invalid ID format");
      return;
    }

    const updated = await updateLauncherType(id, req.body);
    if (!updated) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ status: "error", message: "Launcher type not found" });
      return;
    }
    res.status(StatusCodes.OK).json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(StatusCodes.BAD_REQUEST).json("Invalid ID format");
      return;
    }

    const deleted = await deleteLauncherType(id);
    if (!deleted) {
      res.status(StatusCodes.NOT_FOUND).json("Launcher type not found");
      return;
    }
    res.status(StatusCodes.OK).json("Launcher type deleted successfully");
  } catch (err) {
    next(err);
  }
});

export default router;
