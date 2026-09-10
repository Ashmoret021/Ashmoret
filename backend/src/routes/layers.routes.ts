import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
  addLayer,
  getLayerById
} from "../services/layers.service";

const router = Router();

interface PolygonInput {
  coordinates: [number, number][];
  infoNote?: string;
}

export const addLayer = async (
  layerId: number,
  polygons: PolygonInput[],
): Promise<Polygon[]> => {
  const repo = AppDataSource.getRepository(Polygon);

  const polygonEntities = polygons.map((polygon) =>
    repo.create({
      layerId,
      geometry: {
        type: 'Polygon',
        coordinates: [[...polygon.coordinates, polygon.coordinates[0]]],
      },
      infoNote: polygon.infoNote ?? null,
    }),
  );

  const savedPolygons = await repo.save(polygonEntities);

  logger.info(
    `added ${savedPolygons.length} polygons to layer: ${layerId}`,
  );

  return savedPolygons;
};

router.get("/:id", async ({ params: { id }}, res, next) => {
  try {
    await getLayerById(+id);
    res.status(StatusCodes.CREATED);
  } catch (err) {
    next(err);
  }
});


export default router;
