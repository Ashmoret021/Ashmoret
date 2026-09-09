import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function App() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = L.map(mapRef.current).setView([31.0461, 34.8516], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);











    // --- 1. System definitions (replace counts with real data later) ---

interface SystemType {
  id: string;
  label: string;
  icon: L.Icon;
  remaining: number; // how many are left to place
}

const systems: SystemType[] = [
  {
    id: 'ShieldNest-Lite',
    label: 'ShieldNest-Lite',
    icon: L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    }),
    remaining: 10,
  },
  {
    id: 'IronHook-SR',
    label: 'IronHook-SR',
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    }),
    remaining: 20,
  },
  {
    id: 'HorizonEye-MX	',
    label: 'HorizonEye-MX	',
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    }),
    remaining: 30,
  },
   {
    id: 'CloudFence-Area',
    label: 'CloudFence-Area',
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    }),
    remaining: 30,
  },
];

// Track placed markers so we know which systemId each one belongs to (for removal)
interface PlacedSystem {
  marker: L.Marker;
  systemId: string;
}
const placedSystems: PlacedSystem[] = [];

// --- 2. Generic menu builder (same as before) ---

interface MenuItem {
  label: string;
  disabled?: boolean;
  action: (latlng: L.LatLng) => void;
}

function createContextMenu() {
  const menuEl = document.createElement('div');
  menuEl.style.cssText = `
    display: none; position: absolute; background: white;
    border: 1px solid #ccc; box-shadow: 0 2px 6px rgba(0,0,0,.2);
    z-index: 1000; min-width: 180px; font-family: sans-serif; font-size: 14px;
  `;
  document.body.appendChild(menuEl);

  let currentLatLng: L.LatLng;
  let currentItems: MenuItem[] = [];

  function render() {
    menuEl.innerHTML = currentItems
      .map((item, i) => {
        const style = item.disabled
          ? 'padding:8px 14px;color:#aaa;cursor:not-allowed;'
          : 'padding:8px 14px;cursor:pointer;';
        return `<div data-i="${i}" style="${style}">${item.label}</div>`;
      })
      .join('');
  }

  menuEl.addEventListener('click', (e) => {
    const i = (e.target as HTMLElement).dataset.i;
    if (i === undefined) return;
    const item = currentItems[+i];
    if (item.disabled) return; // ignore clicks on disabled items
    item.action(currentLatLng);
    menuEl.style.display = 'none';
  });

  document.addEventListener('click', () => (menuEl.style.display = 'none'));

  return {
    // items are passed fresh on every show(), so counts are always up to date
    show(x: number, y: number, latlng: L.LatLng, items: MenuItem[]) {
      currentLatLng = latlng;
      currentItems = items;
      render();
      Object.assign(menuEl.style, { left: `${x}px`, top: `${y}px`, display: 'block' });
    },
  };
}

const mapMenu = createContextMenu();
const markerMenu = createContextMenu();

// --- 3. Map right-click: show all systems + remaining counts ---

function buildMapMenuItems(latlng: L.LatLng): MenuItem[] {
  return systems.map((system) => ({
    label: `${system.label} (נותרו: ${system.remaining})`,
    disabled: system.remaining <= 0,
    action: () => {
      if (system.remaining <= 0) return; // safety check
      const marker = L.marker(latlng, { icon: system.icon }).addTo(map);
      placedSystems.push({ marker, systemId: system.id });
      system.remaining -= 1; // update state
      attachRemoveMenu(marker, system.id);
    },
  }));
}

map.on('contextmenu', (e: L.LeafletMouseEvent) => {
  mapMenu.show(e.originalEvent.pageX, e.originalEvent.pageY, e.latlng, buildMapMenuItems(e.latlng));
});

// --- 4. Marker right-click: remove option ---

function attachRemoveMenu(marker: L.Marker, systemId: string) {
  marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e.originalEvent); // don't also open the map menu underneath

    const items: MenuItem[] = [
      {
        label: '✕ הסר מערכת',
        action: () => {
          map.removeLayer(marker);

          const idx = placedSystems.findIndex((p) => p.marker === marker);
          if (idx !== -1) placedSystems.splice(idx, 1);

          const system = systems.find((s) => s.id === systemId);
          if (system) system.remaining += 1; // give the count back
        },
      },
    ];

    markerMenu.show(e.originalEvent.pageX, e.originalEvent.pageY, e.latlng, items);
  });
}




    // interface MenuItem {
    //   label: string;
    //   action: (latlng: L.LatLng) => void;
    // }
    
    // function createContextMenu(items: MenuItem[]) {
    //   const menuEl = document.createElement('div');
    //   menuEl.style.cssText = `
    //     display: none; position: absolute; background: white;
    //     border: 1px solid #ccc; box-shadow: 0 2px 6px rgba(0,0,0,.2);
    //     z-index: 1000; min-width: 160px; font-family: sans-serif; font-size: 14px;
    //   `;
    //   menuEl.innerHTML = items
    //     .map((item, i) => `<div data-i="${i}" style="padding:8px 14px;cursor:pointer">${item.label}</div>`)
    //     .join('');
    //   document.body.appendChild(menuEl);
    
    //   let currentLatLng: L.LatLng;
    
    //   menuEl.addEventListener('click', (e) => {
    //     const i = (e.target as HTMLElement).dataset.i;
    //     if (i !== undefined) items[+i].action(currentLatLng);
    //     menuEl.style.display = 'none';
    //   });
    
    //   document.addEventListener('click', () => (menuEl.style.display = 'none'));
    
    //   return {
    //     show(x: number, y: number, latlng: L.LatLng) {
    //       currentLatLng = latlng;
    //       Object.assign(menuEl.style, { left: `${x}px`, top: `${y}px`, display: 'block' });
    //     },
    //   };
    // }
    
    // // --- Icons ---
    // const blueIcon = L.icon({
    //   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    //   iconSize: [25, 41],
    //   iconAnchor: [12, 41],
    // });
    
    // const redIcon = L.icon({
    //   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    //   iconSize: [25, 41],
    //   iconAnchor: [12, 41],
    // });
    
    // // Keep track of every marker placed, so we can remove/change them later
    // const placedMarkers: L.Marker[] = [];
    
    // // Menu for right-clicking an existing marker
    // function attachMarkerMenu(marker: L.Marker) {
    //   const markerMenu = createContextMenu([
    //     {
    //       label: 'הסר סמן',
    //       action: () => {
    //         map.removeLayer(marker);
    //         const idx = placedMarkers.indexOf(marker);
    //         if (idx !== -1) placedMarkers.splice(idx, 1);
    //       },
    //     },
    //     {
    //       label: 'שנה לצבע אדום',
    //       action: () => marker.setIcon(redIcon),
    //     },
    //     {
    //       label: 'שנה לצבע כחול',
    //       action: () => marker.setIcon(blueIcon),
    //     },
    //   ]);
    
    //   marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
    //     L.DomEvent.stopPropagation(e.originalEvent); // prevent the map's own menu from also opening
    //     markerMenu.show(e.originalEvent.pageX, e.originalEvent.pageY, e.latlng);
    //   });
    // }
    
    // // Menu for right-clicking the map background
    // const contextMenu = createContextMenu([
    //   {
    //     label: 'הוסף סמן כאן',
    //     action: (latlng) => {
    //       const marker = L.marker(latlng, { icon: blueIcon }).addTo(map);
    //       placedMarkers.push(marker);
    //       attachMarkerMenu(marker);
    //     },
    //   },
    //   {
    //     label: 'מרכז מפה כאן',
    //     action: (latlng) => map.setView(latlng, map.getZoom()),
    //   },
    // ]);
    
    // map.on('contextmenu', (e) => contextMenu.show(e.originalEvent.pageX, e.originalEvent.pageY, e.latlng));






    return () => {
      map.remove();
    };
  }, []);

  return <div ref={mapRef} style={{ height: '100vh', width: '100vw' }} />;
}
