import DroneCard from "../DroneCard/DroneCard";
import "./DroneSidebar.css";

export type DroneData = {
  name: string;
  id: string;
  battery: number;
  accumulatedTime: string;
  recurringFault: string;
  previousFault: string;
  lastCheck: string;
  lastFix: string;
  status?: string;
};

type DroneSidebarProps = {
  drones: DroneData[];
};

export default function DroneSidebar({ drones }: DroneSidebarProps) {
  return (
    <aside className="drone-sidebar">
      {drones.map((drone) => (
        <div key={drone.id} className="drone-card-item">
          <DroneCard {...drone} />
        </div>
      ))}
    </aside>
  );
}