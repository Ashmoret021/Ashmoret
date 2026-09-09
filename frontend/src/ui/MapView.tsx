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

/**
 * Geographic bounds that constrain the map view to the Middle East region.
 * SW corner: ~Egypt/Sudan/Red Sea; NE corner: ~Turkey/Iran border.
 * A bit of padding is added so the UI edges don't feel too tight.
 */
const MIDDLE_EAST_BOUNDS: L.LatLngBoundsExpression = [
  [22.0, 25.0],   // SW – south of Egypt / Red Sea
  [42.5, 60.0],   // NE – Turkey / Iran
];
const MIN_ZOOM = 5;

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

    const map = L.map(mapRef.current, {
      preferCanvas: true,
      zoomControl: false,
      // Hard-lock panning to the Middle East; viscosity=1 creates a solid wall
      maxBounds: MIDDLE_EAST_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: MIN_ZOOM,
    }).setView(center, zoom);

    L.control.zoom({ position: 'topleft' }).addTo(map);
    mapInstanceRef.current = map;

    const darkLayer = L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 20,
        attribution: '&copy; Stadia Maps &copy; OpenStreetMap',
      },
    );
    darkLayer.addTo(map);

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

