import { useEffect, useRef, useState } from 'react';
import { Box, ListItemText, ListSubheader, Menu, MenuItem, Paper, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { availableCount, SYSTEM_TYPES, type PlacedSystem, type SystemType } from './systems';
import { addCitiesLayer } from './cities';
import LayerManager from './LayerManager';
import { createTileOverlays, DEFAULT_OVERLAYS, MAP_THEMES, OVERLAYS, themeFilter, type OverlayId, type OverlayVisibility, type ThemeId } from './mapLayers';

type MapMenu = {
  top: number;
  left: number;
} & (
  | { kind: 'place'; latitude: number; longitude: number }
  | { kind: 'delete'; systemId: number }
);

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const overlayLayersRef = useRef<Partial<Record<OverlayId, L.Layer>>>({});
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const nextId = useRef(1);
  const [placedSystems, setPlacedSystems] = useState<PlacedSystem[]>([]);
  const [menu, setMenu] = useState<MapMenu | null>(null);
  const [cityStatus, setCityStatus] = useState('Loading city boundaries...');
  const [theme, setTheme] = useState<ThemeId>('normal');
  const [overlays, setOverlays] = useState<OverlayVisibility>(DEFAULT_OVERLAYS);
  const [tileErrors, setTileErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current, { preferCanvas: true, minZoom: 2, maxZoom: 20 }).setView([31.0461, 34.8516], 6);
    leafletMapRef.current = map;
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    const cities = addCitiesLayer(map, setCityStatus);

    markerLayerRef.current = L.layerGroup().addTo(map);
    const tileOverlays = createTileOverlays();
    for (const [id, layer] of Object.entries(tileOverlays)) {
      const name = OVERLAYS.find((overlay) => overlay.id === id)!.name;
      layer.on('tileerror', () => setTileErrors((current) => current.includes(name) ? current : [...current, name]));
    }
    overlayLayersRef.current = { cities: cities.layer, systems: markerLayerRef.current, ...tileOverlays };
    map.on('contextmenu', (event: L.LeafletMouseEvent) => {
      L.DomEvent.preventDefault(event.originalEvent);
      setMenu({
        kind: 'place',
        top: event.originalEvent.clientY,
        left: event.originalEvent.clientX,
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    });
    map.on('movestart zoomstart', () => setMenu(null));

    return () => {
      cities.remove();
      Object.values(tileOverlays).forEach((layer) => layer.off());
      overlayLayersRef.current = {};
      leafletMapRef.current = null;
      markerLayerRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;
    const selected = MAP_THEMES.find((item) => item.id === theme)!;
    const layer = L.tileLayer(selected.url, {
      attribution: selected.attribution, maxNativeZoom: selected.maxNativeZoom, maxZoom: 20, zIndex: 1,
    });
    layer.on('tileerror', () => setTileErrors((current) => current.includes(selected.name) ? current : [...current, selected.name]));
    layer.addTo(map);
    const container = layer.getContainer();
    if (container) container.style.filter = themeFilter(theme);
    return () => { layer.off(); layer.remove(); };
  }, [theme]);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;
    for (const overlay of OVERLAYS) {
      const layer = overlayLayersRef.current[overlay.id];
      if (!layer) continue;
      if (overlays[overlay.id]) {
        if (!map.hasLayer(layer)) layer.addTo(map);
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }, [overlays]);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    placedSystems.forEach((system) => {
      const type = SYSTEM_TYPES.find((entry) => entry.id === system.typeId)!;
      const label = document.createElement('span');
      label.textContent = `${type.name} #${system.id}`;
      const marker = L.marker([system.latitude, system.longitude], {
        title: `${label.textContent} — click to delete`,
        alt: label.textContent,
        bubblingMouseEvents: false,
        icon: type.id === 'system-a' ? L.icon({
          iconUrl: `${import.meta.env.BASE_URL}interceptor.svg`,
          iconSize: [40, 40], iconAnchor: [20, 20],
        }) : L.divIcon({
          className: '',
          html: `<span style="display:block;width:24px;height:24px;border:3px solid white;border-radius:50%;background:${type.color};box-shadow:0 1px 5px #0008"></span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(layer);
      marker.bindTooltip(label, { permanent: true, direction: 'top', offset: [0, type.id === 'system-a' ? -20 : -12] });
      const openSystemMenu = (event: L.LeafletMouseEvent) => {
        L.DomEvent.stop(event.originalEvent);
        const bounds = marker.getElement()!.getBoundingClientRect();
        setMenu({
          kind: 'delete',
          systemId: system.id,
          top: bounds.top + bounds.height,
          left: bounds.left + bounds.width / 2,
        });
      };
      marker.on('click', openSystemMenu);
      marker.on('contextmenu', openSystemMenu);
    });
    return () => { layer.clearLayers(); };
  }, [placedSystems]);

  const placeSystem = (type: SystemType) => {
    if (menu?.kind !== 'place') return;
    const system: PlacedSystem = {
      id: nextId.current++,
      typeId: type.id,
      latitude: menu.latitude,
      longitude: menu.longitude,
    };
    setPlacedSystems((current) => availableCount(type, current) > 0 ? [...current, system] : current);
    setOverlays((current) => ({ ...current, systems: true }));
    setMenu(null);
  };

  const selectedSystem = menu?.kind === 'delete'
    ? placedSystems.find((system) => system.id === menu.systemId)
    : undefined;
  const selectedType = SYSTEM_TYPES.find((type) => type.id === selectedSystem?.typeId);

  return (
    <>
      <div ref={mapRef} style={{ height: '100vh', width: '100vw' }} />
      <LayerManager theme={theme} overlays={overlays} cityStatus={cityStatus} tileErrors={tileErrors} placedCount={placedSystems.length}
        onTheme={(id) => {
          setTheme(id);
          setTileErrors((current) => current.filter((error) => !MAP_THEMES.some((item) => item.name === error)));
        }}
        onOverlay={(id, visible) => {
          setOverlays((current) => ({ ...current, [id]: visible }));
          setTileErrors((current) => current.filter((error) => error !== OVERLAYS.find((item) => item.id === id)!.name));
        }}
      />
      <Paper sx={{ position: 'absolute', bottom: 36, left: 12, zIndex: 1000, p: 1.5, maxWidth: 'calc(100vw - 24px)' }}>
        <Typography variant="body2">Right-click the map to place a system.</Typography>
        <Typography variant="caption" color="text.secondary">Click a system to delete it. {placedSystems.length} placed.</Typography>
      </Paper>
      <Menu
        open={menu !== null}
        onClose={() => setMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={menu ? { top: menu.top, left: menu.left } : undefined}
        MenuListProps={{ 'aria-label': menu?.kind === 'delete' ? 'System actions' : 'Available systems' }}
      >
        {menu?.kind === 'place' && <ListSubheader>Available systems</ListSubheader>}
        {menu?.kind === 'place' && SYSTEM_TYPES.map((type) => {
          const remaining = availableCount(type, placedSystems);
          return (
            <MenuItem key={type.id} disabled={remaining === 0} onClick={() => placeSystem(type)}>
              {type.id === 'system-a'
                ? <Box component="img" src={`${import.meta.env.BASE_URL}interceptor.svg`} alt="" sx={{ width: 28, height: 28, mr: 1.5 }} />
                : <Box aria-hidden sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: type.color, mr: 1.5 }} />}
              <ListItemText primary={type.name} secondary={`${remaining} available / ${type.count} total`} />
            </MenuItem>
          );
        })}
        {selectedSystem && <ListSubheader>{selectedType?.name} #{selectedSystem.id}</ListSubheader>}
        {selectedSystem && (
          <MenuItem sx={{ color: 'error.main' }} onClick={() => {
            setPlacedSystems((current) => current.filter((system) => system.id !== selectedSystem.id));
            setMenu(null);
          }}>Delete system</MenuItem>
        )}
      </Menu>
    </>
  );
}
