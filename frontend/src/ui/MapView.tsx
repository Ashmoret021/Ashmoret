import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
}

const DEFAULT_CENTER: [number, number] = [31.0461, 34.8516];
const DEFAULT_ZOOM = 6;

export const MapView: React.FC<MapViewProps> = React.memo(({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onMapReady,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapRef.current, { preferCanvas: true }).setView(center, zoom);
    mapInstanceRef.current = map;

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
      },
    );

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
      },
    );

    streetLayer.addTo(map);

    const baseMaps = {
      '🗺️ מפה רגילה': streetLayer,
      '🛰️ צילום לווייני': satelliteLayer,
    };

    L.control.layers(baseMaps).addTo(map);

    fetch('/CITIES.geojson')
      .then((response) => response.json())
      .then((data) => {
        L.geoJSON(data).addTo(map);
      })
      .catch(() => {
        // Fallback gracefully if GeoJSON isn't available
      });

    onMapReadyRef.current?.(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    />
  );
});

