import L from "leaflet";
import { PlacedDrone } from "../types/drone";

export function createDroneDivIcon(drone: PlacedDrone, isHighlighted: boolean = false): L.DivIcon {
  const highlightClass = isHighlighted ? "drone-marker-highlighted" : "";
  const highlightRing = isHighlighted ? '<div class="drone-marker-highlight-ring"></div>' : "";

  const html = `
    <div class="drone-marker-container ${highlightClass}" id="marker-${drone.id}" data-drone-id="${drone.id}">
      <div class="drone-marker-radar-ring"></div>
      ${highlightRing}
      <div class="drone-marker-pin">
        <div class="drone-marker-icon">
          <!-- Tactical Drone Quadcopter Silhouette -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="rgba(255,255,255,0.4)" />
            <path d="M9 9L5 5" />
            <path d="M15 9L19 5" />
            <path d="M9 15L5 19" />
            <path d="M15 15L19 19" />
            <circle cx="5" cy="5" r="2" fill="white" />
            <circle cx="19" cy="5" r="2" fill="white" />
            <circle cx="5" cy="19" r="2" fill="white" />
            <circle cx="19" cy="19" r="2" fill="white" />
          </svg>
        </div>
      </div>
      <div class="drone-marker-badge">גל ${drone.waveId}</div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-drone-leaflet-icon",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

export function createDronePopupContent(
  drone: PlacedDrone,
  onDeleteClick?: (id: string) => void,
  onFocusClick?: (id: string) => void
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.width = "250px";

  const formattedDate = new Date(drone.placedAt).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, #873535 0%, #ad4242 100%); color: #fff; padding: 12px 14px; border-top-left-radius: 12px; border-top-right-radius: 12px;">
      <div style="font-size: 10px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.5px;">רחפן תקיפה</div>
      <div style="font-size: 15px; font-weight: 700; margin-top: 2px; display: flex; align-items: center; justify-content: space-between;">
        <span>${drone.id}</span>
        <span style="font-size: 11px; background: rgba(255,255,255,0.22); padding: 2px 7px; border-radius: 6px;">גל ${drone.waveId}</span>
      </div>
    </div>

    <div style="padding: 12px 14px; font-size: 12px; color: #2e384d; direction: rtl;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #edf1f7;">
        <span style="color: #79879c; font-weight: 500;">דגם:</span>
        <span style="font-weight: 700; color: #1e293b;">${drone.droneType}</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #edf1f7;">
        <span style="color: #79879c; font-weight: 500;">קו רוחב:</span>
        <span style="font-family: monospace; font-weight: 600;">${drone.latitude.toFixed(5)}° N</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #edf1f7;">
        <span style="color: #79879c; font-weight: 500;">קו אורך:</span>
        <span style="font-family: monospace; font-weight: 600;">${drone.longitude.toFixed(5)}° E</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #edf1f7;">
        <span style="color: #79879c; font-weight: 500;">גובה מעל פני שטח:</span>
        <span style="font-weight: 600;">${drone.altitude} מטר</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #edf1f7;">
        <span style="color: #79879c; font-weight: 500;">סטטוס:</span>
        <span style="background: #e6f9f0; color: #0d8a4f; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 700;">מוכן לפעולה</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #79879c; font-weight: 500;">זמן מיקום:</span>
        <span style="color: #64748b; font-size: 11px;">${formattedDate}</span>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 10px;">
        <button id="btn-focus-${drone.id}" type="button" style="flex: 1; padding: 6px 10px; background: #f0f4f9; border: 1px solid #cbd5e1; border-radius: 6px; color: #334155; font-size: 11.5px; font-weight: 600; cursor: pointer;">
          מרכז מפה
        </button>
        <button id="btn-delete-${drone.id}" type="button" style="padding: 6px 10px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; color: #e11d48; font-size: 11.5px; font-weight: 600; cursor: pointer;">
          מחק
        </button>
      </div>
    </div>
  `;

  // Attach button listeners safely
  setTimeout(() => {
    const btnDelete = container.querySelector(`#btn-delete-${drone.id}`);
    if (btnDelete && onDeleteClick) {
      btnDelete.addEventListener("click", () => onDeleteClick(drone.id));
    }

    const btnFocus = container.querySelector(`#btn-focus-${drone.id}`);
    if (btnFocus && onFocusClick) {
      btnFocus.addEventListener("click", () => onFocusClick(drone.id));
    }
  }, 0);

  return container;
}
