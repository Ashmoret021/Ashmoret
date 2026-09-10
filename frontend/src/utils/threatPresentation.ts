import { DroneType } from "../../../types/types";
import type { DroneSimState } from "../simulation/SimulationContext";

export const getDroneHebrewName = (type: DroneType): string => {
  switch (type) {
    case DroneType.FalconLongX4:
      return "בז ארוך טווח";
    case DroneType.LoadBeeM2:
      return "דבורת מטען M2";
    case DroneType.NanoSwarmQ9:
      return "נחיל ננו Q9";
    case DroneType.SkyMiteC7:
      return "קרדית שמיים C7";
    default:
      return "רחפן תקיפה";
  }
};

export const getEstimatedDamage = (type: DroneType): string => {
  switch (type) {
    case DroneType.FalconLongX4:
      return 'קריטי — ראש קרב כבד (150 ק"ג)';
    case DroneType.LoadBeeM2:
      return "גבוה — מטען רסס כפול";
    case DroneType.NanoSwarmQ9:
      return "בינוני — פגיעה מערכתית בריכוז";
    case DroneType.SkyMiteC7:
      return 'נקודתי — רש"ק חודר מוקטן';
    default:
      return "גבוה";
  }
};

export const calculateFlightDistance = (threat: DroneSimState): string => {
  if (threat.route && threat.route.length >= 2) {
    const end = threat.route[threat.route.length - 1];
    const earthRadiusKm = 6371;
    const dLat = ((end.latitude - threat.location.latitude) * Math.PI) / 180;
    const dLon = ((end.longitude - threat.location.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((threat.location.latitude * Math.PI) / 180) *
        Math.cos((end.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.max(1, Math.round(earthRadiusKm * c));
    return `${dist} ק"מ`;
  }

  return '250 ק"מ';
};
