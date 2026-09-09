import L from 'leaflet';

const osm = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const esri = 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';
const arcgis = 'https://server.arcgisonline.com/ArcGIS/rest/services';

export const MAP_THEMES = [
  { id: 'normal', name: 'Normal', source: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: osm, maxNativeZoom: 19 },
  { id: 'earth', name: 'Earth', source: 'Esri imagery', url: `${arcgis}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, attribution: esri, maxNativeZoom: 19 },
  { id: 'dark', name: 'Dark', source: 'OpenStreetMap · styled', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: osm, maxNativeZoom: 19 },
  { id: 'roads', name: 'Roads', source: 'Esri streets', url: `${arcgis}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`, attribution: 'Tiles &copy; Esri — Sources: Esri, HERE, Garmin, USGS, and the GIS User Community', maxNativeZoom: 19 },
  { id: 'light', name: 'Light', source: 'OpenStreetMap · styled', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: osm, maxNativeZoom: 19 },
  { id: 'terrain', name: 'Terrain', source: 'OpenTopoMap', url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: `${osm}, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)`, maxNativeZoom: 17 },
] as const;

export type ThemeId = (typeof MAP_THEMES)[number]['id'];
// Style only the basemap images; markers and overlays retain their own colors.
export function themeFilter(theme: ThemeId) {
  if (theme === 'dark') return 'invert(1) hue-rotate(180deg) saturate(0.45) brightness(0.85)';
  if (theme === 'light') return 'grayscale(1) contrast(0.7) brightness(1.2)';
  return 'none';
}
export const OVERLAYS = [
  { id: 'cities', name: 'City boundaries', description: 'Local city areas and details' },
  { id: 'heights', name: 'Heights / terrain relief', description: 'Shaded hills and valleys; no numeric heights' },
  { id: 'labels', name: 'Place labels', description: 'Place names and borders, useful over Earth' },
  { id: 'railways', name: 'Railways', description: 'Rail routes and infrastructure' },
  { id: 'systems', name: 'Systems', description: 'Placed systems and their names' },
] as const;
export type OverlayId = (typeof OVERLAYS)[number]['id'];
export type OverlayVisibility = Record<OverlayId, boolean>;
export const DEFAULT_OVERLAYS: OverlayVisibility = { cities: true, heights: false, labels: false, railways: false, systems: true };

export function previewUrl(url: string) {
  return url.replace('{z}', '8').replace('{x}', '152').replace('{y}', '104');
}

export function createTileOverlays(): Record<'heights' | 'labels' | 'railways', L.TileLayer> {
  return {
    heights: L.tileLayer(`${arcgis}/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}`, { attribution: 'Tiles &copy; Esri — Sources: Esri, USGS, NOAA', maxNativeZoom: 16, maxZoom: 20, opacity: 0.4, zIndex: 2 }),
    labels: L.tileLayer(`${arcgis}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`, { attribution: 'Tiles &copy; Esri — Sources: Esri, HERE, Garmin, and the GIS User Community', maxNativeZoom: 16, maxZoom: 20, zIndex: 3 }),
    railways: L.tileLayer('https://a.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', { attribution: `${osm} | &copy; <a href="https://www.openrailwaymap.org">OpenRailwayMap</a> (CC-BY-SA)`, maxNativeZoom: 19, maxZoom: 20, zIndex: 4 }),
  };
}
