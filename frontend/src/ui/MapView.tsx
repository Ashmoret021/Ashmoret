import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@mui/material';

export interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
  handleMapReady?: (map: L.Map) => void;
}

const DEFAULT_CENTER: [number, number] = [31.0461, 34.8516];
const DEFAULT_ZOOM = 7;

/**
 * Geographic bounds that constrain the map view to the Middle East region.
 * SW corner: ~Egypt/Sudan/Red Sea; NE corner: ~Turkey/Iran border.
 * A bit of padding is added so the UI edges don't feel too tight.
 */
const MIDDLE_EAST_BOUNDS: L.LatLngBoundsExpression = [
  [22.0, 25.0], // SW – south of Egypt / Red Sea
  [42.5, 60.0], // NE – Turkey / Iran
];
const MIN_ZOOM = 5;

export const MapView: React.FC<MapViewProps> = React.memo(
  ({
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    onMapReady,
    handleMapReady,
  }) => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const onMapReadyRef = useRef(onMapReady);
    onMapReadyRef.current = onMapReady;
    const [rulerActive, setRulerActive] = useState(false);
  const rulerStateRef = useRef<{
    points: L.LatLng[];
    markers: L.Marker[];
    line: L.Polyline | null;
  }>({ points: [], markers: [], line: null });

    useEffect(() => {
      if (!mapRef.current || mapInstanceRef.current) {
        return;
      }

      const map = L.map(mapRef.current, {
        preferCanvas: true,
        zoomControl: false,
        // Hard-lock panning to the Middle East; viscosity=1 creates a solid wall
        maxBounds: MIDDLE_EAST_BOUNDS,
        maxBoundsViscosity: 0.5,
        minZoom: MIN_ZOOM,
      }).setView(center, zoom);

      mapInstanceRef.current = map;

      const darkLayer = L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 20,
          attribution: "&copy; Stadia Maps &copy; OpenStreetMap",
        },
      );
      darkLayer.addTo(map);

      onMapReadyRef.current?.(map);

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    }, []);

  // --- Ruler helpers ---
  const clearRuler = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const rs = rulerStateRef.current;
    rs.markers.forEach((m) => map.removeLayer(m));
    if (rs.line) map.removeLayer(rs.line); // also removes its bound tooltip
    rulerStateRef.current = { points: [], markers: [], line: null };
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleRulerClick = (e: L.LeafletMouseEvent) => {
      const rs = rulerStateRef.current;

      if (rs.points.length >= 2) {
        clearRuler();
      }

      const dotIcon = L.divIcon({
        className: "",
        html: `<div style="width:10px;height:10px;border-radius:50%;background:#e53935;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.5);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const marker = L.marker(e.latlng, { icon: dotIcon }).addTo(map);
      rulerStateRef.current.points.push(e.latlng);
      rulerStateRef.current.markers.push(marker);

      if (rulerStateRef.current.points.length === 2) {
        const [p1, p2] = rulerStateRef.current.points;
        const distKm = (p1.distanceTo(p2) / 1000).toFixed(2);

        const line = L.polyline([p1, p2], {
          color: "#e53935",
          weight: 2,
          dashArray: "6 4",
        }).addTo(map);

        const mid = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);

        line
          .bindTooltip(`${distKm} ק"מ`, {
            permanent: true,
            direction: "center",
          })
          .openTooltip(mid);

        rulerStateRef.current.line = line;
      }
    };

    if (rulerActive) {
      map.getContainer().style.cursor = "crosshair";
      map.on("click", handleRulerClick);
    } else {
      map.getContainer().style.cursor = "";
      map.off("click", handleRulerClick);
      clearRuler();
    }

    return () => {
      map.off("click", handleRulerClick);
    };
  }, [rulerActive]);

    return (
      <>
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

      <div style={{ display: 'flex', position: 'absolute', top: '80px', right: '10px' }}>
        <Button
          title={rulerActive ? "בטל מדידה (ESC)" : "מדוד מרחק"}
          onClick={() => setRulerActive((a) => !a)}
          sx={{
            minWidth: '38px',
            width: '34px',
            height: '38px',
            border: '2px solid',
            borderColor: rulerActive ? '#388e3c' : 'rgba(0,0,0,.2)',
            backgroundColor: 'white',
            fontSize: '22px',
            transition: 'background 0.15s',
            '&:hover': {
              backgroundColor: rulerActive ? '#e8f5e9' : '#f4f4f4'
            },
          }}
        >
          📏
        </Button>
      </div>
      </>
  );
});

