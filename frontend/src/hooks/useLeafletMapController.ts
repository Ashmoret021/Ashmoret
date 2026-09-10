import axios from "axios";
import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import { LeafletRenderer } from "../map/LeafletRenderer";
import { loadScenario } from "../simulation/SimulationContext";
import { sampleScenario } from "../simulation/sampleScenario";

declare global {
  interface Window {
    __clearEngagedDrones?: () => void;
    __leafletRenderer?: LeafletRenderer;
    __resetSimulationRefs?: () => void;
    __tacticalMap?: L.Map;
  }
}

interface UseLeafletMapControllerOptions {
  onClearEngagedDrones: () => void;
  onRendererReady: (renderer: LeafletRenderer) => void;
  onResetSimulationRefs: () => void;
}

export const useLeafletMapController = ({
  onClearEngagedDrones,
  onRendererReady,
  onResetSimulationRefs,
}: UseLeafletMapControllerOptions) => {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const layerControlRef = useRef<L.Control.Layers | null>(null);
  const layersMenuRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [hasMarker, setHasMarker] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapMoveTick, setMapMoveTick] = useState(0);

  const handleMapReady = useCallback(
    (mapArg: L.Map) => {
      setMap(mapArg);
      mapInstanceRef.current = mapArg;

      const renderer = new LeafletRenderer(mapArg);
      onRendererReady(renderer);

      window.__leafletRenderer = renderer;
      window.__clearEngagedDrones = onClearEngagedDrones;
      window.__resetSimulationRefs = onResetSimulationRefs;

      loadScenario(sampleScenario);
      renderer.initDefenseSystems();
      renderer.start();

      markersLayerRef.current = L.layerGroup().addTo(mapArg);

      const streetLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
        },
      );
      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri" },
      );
      const darkLayer = L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 20,
          subdomains: "abcd",
          attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        },
      );

      darkLayer.addTo(mapArg);

      const baseMaps = {
        "🌙 מפה כהה": darkLayer,
        "🗺️ מפה רגילה": streetLayer,
        "🛰️ צילום לווייני": satelliteLayer,
      };

      const layerControl = L.control.layers(baseMaps, undefined, {
        collapsed: false,
      });
      layerControl.addTo(mapArg);
      layerControlRef.current = layerControl;

      mapArg.on("mousemove", (event: L.LeafletMouseEvent) => {
        setCoords({ lat: event.latlng.lat, lng: event.latlng.lng });
      });

      mapArg.on("mouseout", () => {
        setCoords(null);
      });

      const container = layerControl.getContainer();
      const layersMenu = layersMenuRef.current;

      if (container && layersMenu) {
        layersMenu.appendChild(container);
      }

      axios
        .get("/CITIES.geojson")
        .then((response) => {
          const citiesLayer = L.geoJSON(response.data, {
            interactive: false,
            style: {
              color: "#4196f8",
              fillColor: "#4196f8",
              fillOpacity: 0.35,
            },
          });

          layerControl.addOverlay(citiesLayer, "🏙️ ערים");
        })
        .catch((error) => {
          console.error("Failed to load cities layer:", error);
        });

      axios
        .get("/SENSITIVES.geojson")
        .then((response) => {
          const sensitivesLayer = L.geoJSON(response.data, {
            style: {
              color: "#e53935",
              weight: 2,
              fillColor: "#e53935",
              fillOpacity: 0.35,
            },
            onEachFeature: (feature, layer) => {
              const name =
                feature.properties?.HEB_NAME || feature.properties?.CITY_NAME;
              const category = feature.properties?.HEB_CATEGORY;
              if (name) {
                layer.bindPopup(
                  `<strong>${name}</strong>${category ? `<br/>סוג: ${category}` : ""}`,
                );
              }
            },
          });

          mapArg.on("overlayadd", (event: L.LayersControlEvent) => {
            if (event.name === "🛡️ מיקומים רגישים") {
              sensitivesLayer.bringToFront();
            }
          });

          layerControl.addOverlay(sensitivesLayer, "🛡️ אתרים רגישים");
        })
        .catch((error) => {
          console.error("Failed to load sensitives layer:", error);
        });
    },
    [onClearEngagedDrones, onRendererReady, onResetSimulationRefs],
  );

  const handleLayersToggle = useCallback(() => {
    setLayersOpen((isOpen) => !isOpen);
  }, []);

  const handleGoToCoordinates = useCallback((lat: number, lng: number) => {
    const map = mapInstanceRef.current || window.__tacticalMap;
    if (!map) {
      console.warn("Tactical map instance not ready yet");
      return;
    }

    try {
      map.setMaxBounds(undefined);
    } catch {
      // Some Leaflet map implementations do not expose mutable max bounds.
    }

    try {
      map.flyTo([lat, lng], 13, {
        animate: true,
        duration: 1.2,
      });
    } catch {
      map.setView([lat, lng], 13);
    }

    markerRef.current?.remove();

    const pinIcon = L.divIcon({
      className: "custom-coordinate-pin",
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -38],
      html: `
        <div style="
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.7));
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        ">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#ef4444" stroke="#ffffff" stroke-width="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
          </svg>
        </div>
      `,
    });

    markerRef.current = L.marker([lat, lng], { icon: pinIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: sans-serif; text-align: center; padding: 4px 6px;">
          <div style="font-size: 11px; color: #475569; direction: ltr; font-family: monospace;">${lat.toFixed(4)}/${lng.toFixed(4)}</div>
        </div>`,
        {
          maxWidth: 160,
          minWidth: 100,
          className: "small-popup",
        },
      )
      .openPopup();

    setHasMarker(true);
  }, []);

  const handleRemoveMarker = useCallback(() => {
    markerRef.current?.remove();
    markerRef.current = null;
    setHasMarker(false);
  }, []);

  useEffect(() => {
    if (!map) return;

    const handleMove = () => setMapMoveTick((value) => (value + 1) % 10000);
    map.on("move", handleMove);
    map.on("zoom", handleMove);

    return () => {
      map.off("move", handleMove);
      map.off("zoom", handleMove);
    };
  }, [map]);

  useEffect(() => {
    const markersMap = markersMapRef.current;

    return () => {
      markersLayerRef.current = null;
      markersMap.clear();
      mapInstanceRef.current = null;
      markerRef.current = null;
      layerControlRef.current = null;
    };
  }, []);

  return {
    coords,
    handleGoToCoordinates,
    handleLayersToggle,
    handleMapReady,
    handleRemoveMarker,
    hasMarker,
    layersMenuRef,
    layersOpen,
    map,
    mapInstanceRef,
    mapMoveTick,
    markersLayerRef,
    markersMapRef,
  };
};
