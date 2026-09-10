import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, MapPinOff, Navigation, Trash2, X } from "lucide-react";
import "./CoordinateSearch.css";

interface CoordinateSearchProps {
  onGoToCoordinates: (lat: number, lng: number) => void;
  onRemoveMarker?: () => void;
  hasMarker?: boolean;
}

const PRESETS = [
  { name: "תל אביב", lat: "32.0853", lng: "34.7818" },
  { name: "ירושלים", lat: "31.7683", lng: "35.2137" },
  { name: "חיפה", lat: "32.7940", lng: "34.9896" },
  { name: "אילת", lat: "29.5577", lng: "34.9519" },
];

export const CoordinateSearch: React.FC<CoordinateSearchProps> = ({
  onGoToCoordinates,
  onRemoveMarker,
  hasMarker = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isValidLatitude = (value: string) => {
    if (value === "" || value === "-" || value === ".") return false;
    const num = Number(value);
    return Number.isFinite(num) && num >= -90 && num <= 90;
  };

  const isValidLongitude = (value: string) => {
    if (value === "" || value === "-" || value === ".") return false;
    const num = Number(value);
    return Number.isFinite(num) && num >= -180 && num <= 180;
  };

  const parseAndSetCoordinates = (val: string, isLatField: boolean) => {
    // If user pasted a combined string like "31.0461, 34.8516" or "31.0461 34.8516"
    if (
      val.includes(",") ||
      (val.includes(" ") && val.trim().split(/\s+/).length >= 2)
    ) {
      const parts = val.replace(/,/g, " ").trim().split(/\s+/);
      if (parts.length >= 2) {
        const pLat = parts[0];
        const pLng = parts[1];
        if (/^-?\d*\.?\d*$/.test(pLat) && /^-?\d*\.?\d*$/.test(pLng)) {
          setLatitude(pLat);
          setLongitude(pLng);
          return;
        }
      }
    }

    // Normal single-value update
    const cleaned = val.trim();
    if (/^-?\d*\.?\d*$/.test(cleaned) || cleaned === "") {
      if (isLatField) {
        setLatitude(cleaned);
      } else {
        setLongitude(cleaned);
      }
    }
  };

  const latValid = isValidLatitude(latitude);
  const lngValid = isValidLongitude(longitude);
  const canNavigate = latValid && lngValid;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canNavigate) return;
    onGoToCoordinates(Number(latitude), Number(longitude));
    setIsOpen(false);
  };

  const handleClear = () => {
    if (onRemoveMarker) {
      onRemoveMarker();
    }
  };

  const handleApplyPreset = (lat: string, lng: string) => {
    setLatitude(lat);
    setLongitude(lng);
    onGoToCoordinates(Number(lat), Number(lng));
    setIsOpen(false);
  };

  return (
    <div className="coord-search-container" ref={containerRef}>
      <button
        type="button"
        className={`header-action-btn map-tool-btn ${isOpen ? "header-action-btn-active" : ""}`}
        title="חיפוש קואורדינטות במפה"
        aria-label="חיפוש קואורדינטות"
        aria-pressed={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Search size={20} />
        <span>ניווט</span>
        {hasMarker && <span className="coord-marker-badge" />}
      </button>

      {hasMarker && onRemoveMarker && (
        <button
          type="button"
          className="header-action-btn map-tool-btn coord-remove-btn"
          title="הסר סמן מהמפה"
          aria-label="הסר סמן מהמפה"
          onClick={handleClear}
        >
          <MapPinOff size={20} />
          <span>הסר סמן</span>
        </button>
      )}

      {isOpen && (
        <div className="coord-search-dropdown">
          <div className="coord-dropdown-header">
            <div className="coord-dropdown-title">
              <MapPin size={15} className="coord-title-icon" />
              <span>ניווט לקואורדינטות</span>
            </div>
            <button
              type="button"
              className="coord-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="סגור"
            >
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="coord-form">
            <div className="coord-input-group">
              <label htmlFor="coord-lat" className="coord-label">
                קו רוחב (Latitude)
              </label>
              <input
                id="coord-lat"
                type="text"
                className={`coord-input ${latitude !== "" && !latValid ? "error" : ""}`}
                value={latitude}
                onChange={(e) => parseAndSetCoordinates(e.target.value, true)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (pasted.includes(",") || pasted.includes(" ")) {
                    e.preventDefault();
                    parseAndSetCoordinates(pasted, true);
                  }
                }}
                placeholder="לדוגמה: 31.0461"
                autoFocus
              />
              {latitude !== "" && !latValid && (
                <span className="coord-error-text">
                  חייב להיות בין -90 ל-90
                </span>
              )}
            </div>

            <div className="coord-input-group">
              <label htmlFor="coord-lng" className="coord-label">
                קו אורך (Longitude)
              </label>
              <input
                id="coord-lng"
                type="text"
                className={`coord-input ${longitude !== "" && !lngValid ? "error" : ""}`}
                value={longitude}
                onChange={(e) => parseAndSetCoordinates(e.target.value, false)}
                placeholder="לדוגמה: 34.8516"
              />
              {longitude !== "" && !lngValid && (
                <span className="coord-error-text">
                  חייב להיות בין -180 ל-180
                </span>
              )}
            </div>

            <div className="coord-presets">
              <span className="coord-presets-title">יעדים מהירים:</span>
              <div className="coord-presets-buttons">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="coord-preset-chip"
                    onClick={() => handleApplyPreset(p.lat, p.lng)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="coord-actions">
              <button
                type="submit"
                disabled={!canNavigate}
                className="coord-submit-btn"
              >
                <Navigation size={14} />
                <span>נווט למיקום</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
