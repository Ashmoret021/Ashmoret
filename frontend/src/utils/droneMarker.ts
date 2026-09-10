import L from "leaflet";
import { PlacedDrone } from "../types/drone";
import { getClosestDirection } from "../constants/droneConstants";

export function createDroneDivIcon(drone: PlacedDrone, isHighlighted: boolean = false): L.DivIcon {
  const highlightClass = isHighlighted ? "drone-marker-highlighted" : "";
  const highlightRing = isHighlighted ? '<div class="drone-marker-highlight-ring"></div>' : "";
  const angle = Math.round(drone.angle ?? drone.heading ?? 0);

  const html = `
    <div class="drone-marker-container ${highlightClass}" id="marker-${drone.id}" data-drone-id="${drone.id}" title="רחפן ${drone.name || drone.id} | כיוון: ${angle}°">
      <div class="drone-marker-radar-ring"></div>
      ${highlightRing}
      <!-- Direction Heading Arrow Pointer -->
      <div class="drone-heading-pointer" style="transform: rotate(${angle}deg);">
        <div class="drone-heading-arrow-tip">▲</div>
      </div>
      <div class="drone-marker-pin">
        <div class="drone-marker-icon">
          <!-- Tactical Drone Quadcopter Silhouette oriented to drone angle -->
          <div class="drone-quad-rotator" style="transform: rotate(${angle}deg); display: flex; align-items: center; justify-content: center; width: 18px; height: 18px;">
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
      </div>
      <div class="drone-marker-badge">גל ${drone.waveId}</div>
      <div class="drone-angle-indicator">${angle}°</div>
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
  onFocusClick?: (id: string) => void,
  onAngleChange?: (id: string, newAngle: number) => void
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.width = "260px";

  const formattedDate = new Date(drone.placedAt).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const initialAngle = Math.round(drone.angle ?? drone.heading ?? 0);

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, #873535 0%, #ad4242 100%); color: #fff; padding: 12px 14px; border-top-left-radius: 12px; border-top-right-radius: 12px;">
      <div style="font-size: 10px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.5px;">רחפן תקיפה</div>
      <div style="font-size: 15px; font-weight: 700; margin-top: 2px; display: flex; align-items: center; justify-content: space-between;">
        <span>${drone.name || drone.id}</span>
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
        <span id="label-lat-${drone.id}" style="font-family: monospace; font-weight: 600;">${drone.latitude.toFixed(5)}° N</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #edf1f7;">
        <span style="color: #79879c; font-weight: 500;">קו אורך:</span>
        <span id="label-lng-${drone.id}" style="font-family: monospace; font-weight: 600;">${drone.longitude.toFixed(5)}° E</span>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #edf1f7;">
        <span style="color: #79879c; font-weight: 500;">גובה:</span>
        <span style="font-weight: 600;">${drone.altitude} מטר</span>
      </div>

      <!-- Interactive Angle/Heading Rotation Section -->
      <div style="margin-top: 8px; margin-bottom: 8px; padding: 8px 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="color: #475569; font-weight: 700; font-size: 11.5px;">כיוון טיסה (זווית):</span>
          <span id="label-angle-${drone.id}" style="font-weight: 800; color: #b45309; background: #fef3c7; padding: 2px 7px; border-radius: 5px; font-size: 11.5px;">
            ${initialAngle}° (${getClosestDirection(initialAngle)})
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <button id="btn-rot-minus-${drone.id}" type="button" title="סובב 15- מעלות" style="padding: 3px 6px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; color: #334155;">-15°</button>
          <input id="slider-angle-${drone.id}" type="range" min="0" max="360" step="1" value="${initialAngle}" style="flex: 1; height: 5px; cursor: pointer; accent-color: #873535;" />
          <button id="btn-rot-plus-${drone.id}" type="button" title="סובב 15+ מעלות" style="padding: 3px 6px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; color: #334155;">+15°</button>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 3px;">
          <button class="btn-preset-angle" data-angle="0" type="button" style="flex: 1; padding: 3px 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 9.5px; font-weight: 600; cursor: pointer; color: #475569;">0° צ</button>
          <button class="btn-preset-angle" data-angle="45" type="button" style="flex: 1; padding: 3px 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 9.5px; font-weight: 600; cursor: pointer; color: #475569;">45°</button>
          <button class="btn-preset-angle" data-angle="90" type="button" style="flex: 1; padding: 3px 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 9.5px; font-weight: 600; cursor: pointer; color: #475569;">90° מ</button>
          <button class="btn-preset-angle" data-angle="180" type="button" style="flex: 1; padding: 3px 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 9.5px; font-weight: 600; cursor: pointer; color: #475569;">180° ד</button>
          <button class="btn-preset-angle" data-angle="270" type="button" style="flex: 1; padding: 3px 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 9.5px; font-weight: 600; cursor: pointer; color: #475569;">270° מע</button>
        </div>
      </div>

      <div style="font-size: 10.5px; color: #64748b; margin-bottom: 6px; text-align: center;">
        💡 ניתן לגרור את הרחפן על המפה לשינוי מיקום
      </div>

      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <button id="btn-focus-${drone.id}" type="button" style="flex: 1; padding: 6px 10px; background: #f0f4f9; border: 1px solid #cbd5e1; border-radius: 6px; color: #334155; font-size: 11.5px; font-weight: 600; cursor: pointer;">
          מרכז מפה
        </button>
        <button id="btn-delete-${drone.id}" type="button" style="padding: 6px 10px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; color: #e11d48; font-size: 11.5px; font-weight: 600; cursor: pointer;">
          מחק
        </button>
      </div>
    </div>
  `;

  // Attach button & rotation listeners safely
  setTimeout(() => {
    const btnDelete = container.querySelector(`#btn-delete-${drone.id}`);
    if (btnDelete && onDeleteClick) {
      btnDelete.addEventListener("click", () => onDeleteClick(drone.id));
    }

    const btnFocus = container.querySelector(`#btn-focus-${drone.id}`);
    if (btnFocus && onFocusClick) {
      btnFocus.addEventListener("click", () => onFocusClick(drone.id));
    }

    const slider = container.querySelector<HTMLInputElement>(`#slider-angle-${drone.id}`);
    const labelAngle = container.querySelector<HTMLElement>(`#label-angle-${drone.id}`);
    const btnMinus = container.querySelector(`#btn-rot-minus-${drone.id}`);
    const btnPlus = container.querySelector(`#btn-rot-plus-${drone.id}`);
    const presetButtons = container.querySelectorAll<HTMLButtonElement>(".btn-preset-angle");

    const applyAngle = (newAngle: number) => {
      const norm = ((Math.round(newAngle) % 360) + 360) % 360;
      if (slider) slider.value = String(norm);
      if (labelAngle) {
        labelAngle.textContent = `${norm}° (${getClosestDirection(norm)})`;
      }

      // Live update the visual DOM marker immediately
      const markerEl = document.getElementById(`marker-${drone.id}`);
      if (markerEl) {
        const pointer = markerEl.querySelector<HTMLElement>(".drone-heading-pointer");
        if (pointer) pointer.style.transform = `rotate(${norm}deg)`;
        const rotator = markerEl.querySelector<HTMLElement>(".drone-quad-rotator");
        if (rotator) rotator.style.transform = `rotate(${norm}deg)`;
        const angleBadge = markerEl.querySelector<HTMLElement>(".drone-angle-indicator");
        if (angleBadge) angleBadge.textContent = `${norm}°`;
        markerEl.setAttribute("title", `רחפן ${drone.name || drone.id} | כיוון: ${norm}°`);
      }

      if (onAngleChange) {
        onAngleChange(drone.id, norm);
      }
    };

    if (slider) {
      slider.addEventListener("input", (e) => {
        const val = Number((e.target as HTMLInputElement).value);
        applyAngle(val);
      });
    }

    if (btnMinus) {
      btnMinus.addEventListener("click", () => {
        const current = slider ? Number(slider.value) : 0;
        applyAngle(current - 15);
      });
    }

    if (btnPlus) {
      btnPlus.addEventListener("click", () => {
        const current = slider ? Number(slider.value) : 0;
        applyAngle(current + 15);
      });
    }

    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetAngle = Number(btn.getAttribute("data-angle"));
        if (!isNaN(targetAngle)) {
          applyAngle(targetAngle);
        }
      });
    });
  }, 0);

  return container;
}
