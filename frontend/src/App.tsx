import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Drone, DroneType } from './types/types';
import DroneModal from './components/DroneModal/DroneModal';

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView([31.0461, 34.8516], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  const drone: Drone = {id: 1, location : {agl : 1, asl : 1, latitude : 31, longitude : 34}, type: DroneType.FalconLongX4, velocity: 67, heading: 3};

  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(drone);

  return (
    <>
    {selectedDrone && <DroneModal drone={selectedDrone} estimatedDamage='1' flightDistance={300} droneName='meofefi' hebrewName='מעופפי' onClose={() => setSelectedDrone(null)}/>}
    <div ref={mapRef} style={{ height: '100vh', width: '100vw' }} />
    </>
  );
}
