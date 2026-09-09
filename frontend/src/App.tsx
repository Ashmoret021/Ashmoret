import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CoordinatesControl } from "./components/CoordinatesControl";

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView([31.0461, 34.8516], 6);

    const streetLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      },
    );

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
      },
    );

    streetLayer.addTo(map);

    const baseMaps = {
      "🗺️ מפה רגילה": streetLayer,
      "🛰️ צילום לווייני": satelliteLayer,
    };

    L.control.layers(baseMaps).addTo(map);

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on("mouseout", () => {
      setCoords(null);
    });

    fetch("/CITIES.geojson")
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data).addTo(map);
      });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <div
        ref={mapRef}
        style={{
          height: "100%",
          width: "100%",
        }}
      />
      <CoordinatesControl coords={coords} />
    </div>
  );
}
