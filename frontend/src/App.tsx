import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DefenseSide } from './components/DefenseSide/defenseSide';

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const mapInstance = L.map(mapRef.current).setView([31.0461, 34.8516], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance);

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  return (
    <>
      <div
        ref={mapRef}
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
        }}
      />

      <DefenseSide map={map} />
    </>
  );
}
