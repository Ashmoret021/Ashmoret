import L from 'leaflet';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PinpointResult {
  position: Coordinates;
  /** Degrees clockwise from north (0-360). Only present when `pickDirection` is used. */
  heading?: number;
}

export interface PinpointOptions {
  /** After picking the point, let the user pick a direction with a follow-cursor arrow. */
  pickDirection?: boolean;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** Initial compass bearing (0-360, clockwise from north) from one coordinate to another. */
export const calculateBearing = (from: Coordinates, to: Coordinates): number => {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
};

/**
 * Lets the user click a point on the map to pick coordinates.
 * If `pickDirection` is set, after the first click an arrow follows the cursor
 * (showing the live degree reading) until a second click locks in the heading.
 *
 * Resolves with the picked coordinates (and heading, if requested).
 */
export const pinpointOnMap = (
  map: L.Map,
  options: PinpointOptions = {},
): Promise<PinpointResult> => {
  return new Promise((resolve) => {
    const originalCursor = map.getContainer().style.cursor;
    map.getContainer().style.cursor = 'crosshair';

    const restoreCursor = () => {
      map.getContainer().style.cursor = originalCursor;
    };

    map.once('click', (firstEvent: L.LeafletMouseEvent) => {
      const position: Coordinates = {
        lat: firstEvent.latlng.lat,
        lng: firstEvent.latlng.lng,
      };

      const pointMarker = L.marker(firstEvent.latlng).addTo(map);

      if (!options.pickDirection) {
        map.removeLayer(pointMarker);
        restoreCursor();
        resolve({ position });
        return;
      }

      const directionLine = L.polyline([firstEvent.latlng, firstEvent.latlng], {
        color: '#1976d2',
        weight: 3,
      }).addTo(map);

      const arrowMarker = L.marker(firstEvent.latlng, {
        icon: L.divIcon({
          className: 'pinpoint-direction-arrow',
          html: '<span style="display:inline-block;font-size:24px;line-height:24px;color:#1976d2;">&#8593;</span>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        interactive: false,
      }).addTo(map);

      const degreeLabel = L.tooltip({ permanent: true, direction: 'right', offset: [12, 0] })
        .setLatLng(firstEvent.latlng)
        .setContent('0°')
        .addTo(map);

      const handleMouseMove = (moveEvent: L.LeafletMouseEvent) => {
        const heading = calculateBearing(position, {
          lat: moveEvent.latlng.lat,
          lng: moveEvent.latlng.lng,
        });

        directionLine.setLatLngs([firstEvent.latlng, moveEvent.latlng]);

        const arrowSpan = arrowMarker.getElement()?.querySelector('span');
        if (arrowSpan instanceof HTMLElement) {
          arrowSpan.style.transform = `rotate(${heading}deg)`;
        }

        degreeLabel.setLatLng(moveEvent.latlng);
        degreeLabel.setContent(`${heading.toFixed(1)}°`);
      };

      map.on('mousemove', handleMouseMove);

      map.once('click', (secondEvent: L.LeafletMouseEvent) => {
        map.off('mousemove', handleMouseMove);

        const heading = calculateBearing(position, {
          lat: secondEvent.latlng.lat,
          lng: secondEvent.latlng.lng,
        });

        map.removeLayer(pointMarker);
        map.removeLayer(directionLine);
        map.removeLayer(arrowMarker);
        map.removeLayer(degreeLabel);
        restoreCursor();

        resolve({ position, heading });
      });
    });
  });
};
