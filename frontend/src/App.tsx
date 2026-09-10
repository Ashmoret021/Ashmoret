import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Cards from './components/CardList';

export default function App() {
  return Cards();
  // const mapRef = useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   if (!mapRef.current) {
  //     return;
  //   }

  //   const map = L.map(mapRef.current).setView([31.0461, 34.8516], 6);

  //   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  //     attribution: '&copy; OpenStreetMap contributors',
  //   }).addTo(map);

  //   return () => {
  //     map.remove();
  //   };
  // }, []);

  // return <div ref={mapRef} style={{ height: '100vh', width: '100vw' }} />;
}
