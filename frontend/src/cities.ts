import L from 'leaflet';
import type { FeatureCollection, Polygon } from 'geojson';

type CityProperties = Record<string, unknown>;

export function addCitiesLayer(map: L.Map, onStatus: (message: string) => void) {
  const controller = new AbortController();
  const cities = L.geoJSON<CityProperties>(undefined, {
    style: { color: '#2563eb', weight: 1.5, fillOpacity: 0.12 },
    onEachFeature: (feature, layer) => {
      const properties = feature.properties;
      const name = String(properties.ENG_NAME || properties.CITY_NAME || 'Unnamed city');
      const tooltip = document.createElement('span');
      tooltip.textContent = name;
      layer.bindTooltip(tooltip, { sticky: true });

      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = name;
      popup.append(title);
      for (const [label, key] of [
        ['Local name', 'CITY_NAME'],
        ['City', 'ENG_CITY'],
        ['City ID', 'CITY_ID'],
        ['District', 'DIST_NAME'],
        ['Region', 'ZONE_NAME'],
      ]) {
        const value = properties[key];
        if (value === null || value === undefined || value === '') continue;
        const row = document.createElement('div');
        row.dir = 'auto';
        row.textContent = `${label}: ${String(value)}`;
        popup.append(row);
      }
      layer.bindPopup(popup);
      if (layer instanceof L.Path) {
        layer.on('mouseover', () => layer.setStyle({ weight: 3, fillOpacity: 0.3 }));
        layer.on('mouseout', () => cities.resetStyle(layer));
      }
    },
  }).addTo(map);

  void (async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}CITIES.geojson`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`City data request failed: ${response.status}`);
      const data: FeatureCollection<Polygon, CityProperties> = await response.json();
      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error('Invalid city GeoJSON');
      }
      if (controller.signal.aborted) return;
      cities.addData(data);
      onStatus(`${data.features.length.toLocaleString()} city areas loaded. Click an area for details.`);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Unable to load city boundaries', error);
      onStatus('City boundaries could not be loaded. Reload the page to retry.');
    }
  })();

  return {
    layer: cities,
    remove: () => {
      controller.abort();
      cities.remove();
    },
  };
}
