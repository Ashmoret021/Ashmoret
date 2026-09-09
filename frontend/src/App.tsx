import { useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView([31.0461, 34.8516], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    axios
      .get("/CITIES.geojson")
      .then((response) => {
        L.geoJSON(response.data).addTo(map);
      })
      .catch((error) => {
        console.error("Failed to load cities:", error);
      });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        height: "100vh",
        width: "100vw",
      }}
    />
  );
}
