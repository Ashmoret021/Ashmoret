import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  center = [31.0461, 34.8516],
  zoom = 6,
  onMapReady,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView(center, zoom);
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

    onMapReady?.(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom, onMapReady]);

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
};
