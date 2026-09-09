import { DroneWave } from "../types/drone";

export const droneTypes = [
  "SkyMite-C7",
  "LoadBee-M2",
  "Falcon-Long X4",
  "NanoSwarm-Q9",
];

export const borders = [
  "בחר גבול...",
  "גבול צפוני",
  "גבול דרומי",
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
