import DroneCard from "../DroneCard/DroneCard";
import InterceptorCard from "../InterceptorCard/InterceptorCard";
import "./AircraftSidebar.css";

export type DroneData = {
  name: string;
  id: string;
  droneType: string;
  estimatedAttackQuantity: number | string;
  unitCost: number | string;
  totalCost: number | string;
  simulatedThreatNature: string;
  flightDistance: number | string;
  flightSpeed: number | string;
  estimatedDamage: string;
  intelligenceAssessmentLebanon: string;
  intelligenceAssessmentGaza: string;
  status?: string;
};

export type InterceptorData = {
  id: string;
  simulatedSystemName: string;
  systemQuantity: number | string;
  simulatedInterceptorName: string;
  interceptorsPerSystem: number | string;
  totalInterceptors: number | string;
  interceptorCost: number | string;
  estimatedInterceptionSuccessRate: number | string;
  operationalRange: number | string;
  status?: string;
}

export type AircraftData = DroneData | InterceptorData;

type AircraftSidebarProps = {
  aircrafts: AircraftData[];
};

function isDrone(aircraft: AircraftData): aircraft is DroneData {
  return "droneType" in aircraft;
}

export default function AircraftSidebar({ aircrafts }: AircraftSidebarProps) {
  return (
    <aside className="aircraft-sidebar">
      {aircrafts.map((aircraft) => (
        <div key={aircraft.id} className="aircraft-card-item">
          {isDrone(aircraft) ? (
            <DroneCard {...aircraft} />
          ) : (
            <InterceptorCard {...aircraft} />
          )}
        </div>
      ))}
    </aside>
  );
}