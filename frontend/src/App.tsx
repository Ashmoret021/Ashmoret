import { useEffect, useRef, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [layers, setLayers] = useState<string[]>(["🗺️ מפה רגילה"]);

  useEffect(() => {
    console.log("Active layers:", layers);
  }, [layers]);

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

    const layerControl = L.control
      .layers(baseMaps)
      .addTo(map);

    layerControl
      .getContainer()
      ?.classList.add("top-center-layer-control");

    const baseLayerNames = Object.keys(baseMaps);

    map.on("baselayerchange", (e: L.LayersControlEvent) => {
      setLayers((prev) => [
        ...prev.filter((name) => !baseLayerNames.includes(name)),
        e.name,
      ]);
    });

    map.on("overlayadd", (e: L.LayersControlEvent) => {
      setLayers((prev) => [...prev.filter((name) => name !== e.name), e.name]);
    });

    map.on("overlayremove", (e: L.LayersControlEvent) => {
      setLayers((prev) => prev.filter((name) => name !== e.name));
    });

    axios
      .get("/CITIES.geojson")
      .then((response) => {
        const citiesLayer = L.geoJSON(response.data);

        layerControl.addOverlay(
          citiesLayer,
          "🏙️ ערים",
        );
      })
      .catch((error) => {
        console.error("Failed to load cities layer:", error);
      });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <>
      <style>
        {`
          .top-center-layer-control {
            position: fixed !important;
            top: 20px !important;
            left: 50% !important;
          }
        `}
      </style>

      <div
        ref={mapRef}
        style={{
          height: "100vh",
          width: "100vw",
        }}
      />
    </>
  );
}