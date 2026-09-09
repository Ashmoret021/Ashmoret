import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapLegend } from './MapLegend';
import { MapControls } from './MapControls';
import './TacticalMap.css';

const DEFAULT_CENTER: [number, number] = [31.6, 35.0];
const DEFAULT_ZOOM = 8;

export const TacticalMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Tactical dark base tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Tactical Operational Sector Polygon
    const operationalSectorCoords: [number, number][] = [
      [33.3, 35.55],
      [33.1, 35.8],
      [32.7, 35.9],
      [32.3, 35.6],
      [31.9, 35.5],
      [31.4, 35.4],
      [30.8, 35.15],
      [30.0, 34.95],
      [31.1, 34.3],
      [31.7, 34.55],
      [32.4, 34.85],
      [33.0, 35.1],
    ];

    L.polygon(operationalSectorCoords, {
      color: '#1e3a8a',
      weight: 1.5,
      opacity: 0.9,
      fillColor: '#0b1426',
      fillOpacity: 0.6,
    }).addTo(map);

    // Tactical Radar Circles
    L.circle([32.9, 35.4], {
      radius: 22000,
      color: '#ef4444',
      weight: 1,
      opacity: 0.4,
      fill: false,
      dashArray: '4, 4',
    }).addTo(map);

    L.circle([31.9, 35.5], {
      radius: 18000,
      color: '#ef4444',
      weight: 1,
      opacity: 0.35,
      fill: false,
      dashArray: '3, 3',
    }).addTo(map);

    // Helper for HTML markers
    const createHtmlMarker = (lat: number, lng: number, htmlContent: string) => {
      const customIcon = L.divIcon({
        className: 'tactical-div-icon',
        html: htmlContent,
        iconSize: [80, 40],
        iconAnchor: [40, 20],
      });
      L.marker([lat, lng], { icon: customIcon }).addTo(map);
    };

    // Threat #04 (North) with arrow and tag
    createHtmlMarker(
      33.0,
      35.45,
      `<div class="tactical-marker-threat">
        <div class="threat-header">
          <span class="threat-label">צפון</span>
          <span class="threat-arrow">&#10140;</span>
        </div>
        <div class="threat-badge-outer">
          <div class="threat-badge pink">#04</div>
        </div>
      </div>`
    );

    // Threat #05 & #06 (East) with downward arrow and tag
    createHtmlMarker(
      31.85,
      35.55,
      `<div class="tactical-marker-threat down">
        <div class="threat-badge-outer">
          <div class="threat-badge red">#05</div>
        </div>
        <div class="threat-header">
          <span class="threat-label">מזרח</span>
          <span class="threat-arrow-down">&#10140;</span>
        </div>
        <div class="threat-badge-outer">
          <div class="threat-badge yellow">#06</div>
        </div>
      </div>`
    );

    // Threat #07
    createHtmlMarker(
      32.9,
      35.75,
      `<div class="tactical-marker-threat single">
        <div class="threat-diamond red"></div>
        <span class="threat-id">#07</span>
      </div>`
    );

    // Marker #03 (Yellow diamond)
    createHtmlMarker(
      32.9,
      35.25,
      `<div class="tactical-marker-threat single">
        <div class="threat-diamond yellow"></div>
        <span class="threat-id">#03</span>
      </div>`
    );

    // Tactical Outpost Points
    const outposts: { name: string; lat: number; lng: number }[] = [
      { name: 'נקודת תצפית צפון', lat: 32.55, lng: 35.3 },
      { name: 'אסטרונצי א׳', lat: 32.0, lng: 35.1 },
      { name: 'מרכז לוגיסטי', lat: 31.45, lng: 34.95 },
      { name: 'אסטרונצי ב׳', lat: 31.65, lng: 34.8 },
      { name: 'נקודת תצפית דרום', lat: 30.9, lng: 34.85 },
    ];

    outposts.forEach((item) => {
      createHtmlMarker(
        item.lat,
        item.lng,
        `<div class="tactical-outpost-node">
          <div class="outpost-target-ring"></div>
          <span class="outpost-label">${item.name}</span>
        </div>`
      );
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetCenter = () => {
    mapInstanceRef.current?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  };

  return (
    <div className="tactical-map-container">
      {/* Leaflet map DOM element */}
      <div ref={mapContainerRef} className="map-canvas" />

      {/* Top Left Legend */}
      <MapLegend />

      {/* Bottom Left Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetCenter={handleResetCenter}
      />
    </div>
  );
};
