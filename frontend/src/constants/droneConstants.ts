import { DroneWave } from "../types/drone";

export const droneTypes = [
  "SkyMite-C7",
  "LoadBee-M2",
  "Falcon-Long X4",
  "NanoSwarm-Q9",
];

export const borders = [
  "בחר גבול...",
  "עזה",
  "לבנון",
];

export const directions = [
  "צפון",
  "צפון-מזרח",
  "מזרח",
  "דרום-מזרח",
  "דרום",
  "דרום-מערב",
  "מערב",
  "צפון-מערב",
];

export const directionAngles: Record<string, number> = {
  "צפון": 0,
  "צפון-מזרח": 45,
  "מזרח": 90,
  "דרום-מזרח": 135,
  "דרום": 180,
  "דרום-מערב": 225,
  "מערב": 270,
  "צפון-מערב": 315,
};

export function getClosestDirection(angle: number): string {
  const normalized = ((angle % 360) + 360) % 360;
  let closestDir = "צפון";
  let minDiff = 360;
  for (const [dir, dirAngle] of Object.entries(directionAngles)) {
    const diff = Math.min(
      Math.abs(normalized - dirAngle),
      360 - Math.abs(normalized - dirAngle)
    );
    if (diff < minDiff) {
      minDiff = diff;
      closestDir = dir;
    }
  }
  return closestDir;
}

export const createWave = (id: number): DroneWave => ({
  id,
  open: true,
  droneType: droneTypes[0],
  border: "",
  quantity: 1,
  angle: 45,
  direction: "צפון-מזרח",
  altitude: 100,
  simulationArea: false,
});

/**
 * Operational boundaries covering southern Gaza through northern Lebanon
 */
export const OPERATIONAL_BOUNDS = {
  minLat: 30.5,
  maxLat: 34.8,
  minLng: 33.8,
  maxLng: 36.8,
};

export function isWithinOperationalBounds(lat: number, lng: number): boolean {
  return (
    lat >= OPERATIONAL_BOUNDS.minLat &&
    lat <= OPERATIONAL_BOUNDS.maxLat &&
    lng >= OPERATIONAL_BOUNDS.minLng &&
    lng <= OPERATIONAL_BOUNDS.maxLng
  );
}

/**
 * Creates a visually balanced tactical formation of drones around a clicked center point
 */
export function createDroneFormation(
  center: { lat: number; lng: number },
  count: number,
  spacingMeters: number = 220
): Array<{ lat: number; lng: number }> {
  if (count <= 1) {
    return [{ lat: Number(center.lat.toFixed(6)), lng: Number(center.lng.toFixed(6)) }];
  }

  const latOffsetPerMeter = 1 / 111000;
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  const lngOffsetPerMeter = 1 / (111000 * (cosLat || 1));

  const dLat = spacingMeters * latOffsetPerMeter;
  const dLng = spacingMeters * lngOffsetPerMeter;

  // Determine row distribution (symmetrical tactical pattern: e.g. 11 drones -> 3 - 5 - 3)
  let rowCounts: number[] = [];
  if (count <= 3) {
    rowCounts = [count];
  } else if (count <= 6) {
    const half = Math.floor(count / 2);
    rowCounts = [half, count - half];
  } else if (count <= 15) {
    const wing = Math.max(2, Math.floor((count - 3) / 2 / 1.5));
    const centerRow = count - 2 * wing;
    rowCounts = [wing, centerRow, wing];
  } else {
    const numRows = Math.ceil(Math.sqrt(count));
    const basePerRow = Math.floor(count / numRows);
    const rem = count % numRows;
    rowCounts = Array(numRows).fill(basePerRow);
    for (let i = 0; i < rem; i++) {
      rowCounts[Math.floor(numRows / 2) + (i % 2 === 0 ? Math.floor(i / 2) : -Math.ceil(i / 2))]++;
    }
  }

  const numRows = rowCounts.length;
  const points: Array<{ lat: number; lng: number }> = [];

  for (let r = 0; r < numRows; r++) {
    const countInRow = rowCounts[r];
    const rowOffsetLat = -(r - (numRows - 1) / 2) * dLat;

    for (let c = 0; c < countInRow; c++) {
      const colOffsetLng = (c - (countInRow - 1) / 2) * dLng;
      points.push({
        lat: Number((center.lat + rowOffsetLat).toFixed(6)),
        lng: Number((center.lng + colOffsetLng).toFixed(6)),
      });
    }
  }

  return points;
}

