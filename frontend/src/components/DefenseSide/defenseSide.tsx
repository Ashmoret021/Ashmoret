import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";

export type DefenseDetails = {
  id: number;
  attackName: string;
  description: string;
  interceptors: string;
  border: string;
  interceptionType: string;
  location?: { lat: number; lng: number };
};

const borders = ["עזה", "לבנון"];

const interceptionTypes = [
  "יירוט אווירי",
  "יירוט בליסטי",
  "יירוט טילי שיוט",
  "יירוט רחפנים",
];

const createEmptyDefense = (): DefenseDetails => ({
  id: Date.now() + Math.random(),
  attackName: "",
  description: "",
  interceptors: "",
  border: "",
  interceptionType: "",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  padding: "0 13px",
  borderRadius: "8px",
  border: "1px solid #d5dce7",
  background: "#fff",
  color: "#172033",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  direction: "rtl",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: "86px",
  padding: "11px 13px",
  resize: "vertical",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "7px",
  color: "#263449",
  fontSize: "13px",
  fontWeight: 600,
  direction: "rtl",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const escapeHtml = (str: string) => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const createInterceptionIcon = (index: number) => {
  return L.divIcon({
    className: "interception-marker-icon",
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(23, 101, 181, 0.28);
          animation: interceptionPulse 2s infinite ease-out;
        "></div>
        <div style="
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #102a56 0%, #1765b5 100%);
          border: 2px solid #ffffff;
          box-shadow: 0 4px 14px rgba(16, 42, 86, 0.45), 0 0 12px rgba(23, 101, 181, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8.5" stroke="#ffffff" stroke-width="1.6" stroke-dasharray="2 2" opacity="0.85"/>
            <circle cx="12" cy="12" r="4.5" fill="#38bdf8" fill-opacity="0.35" stroke="#38bdf8" stroke-width="1.5"/>
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="2" fill="#ffffff"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #1d72cf;
          color: #ffffff;
          border: 1.5px solid #ffffff;
          border-radius: 50%;
          width: 17px;
          height: 17px;
          font-size: 10px;
          font-weight: 800;
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.35);
        ">
          ${index}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

export interface DefenseSideProps {
  initialOpen?: boolean;
  map?: L.Map | null;
}

export const DefenseSide: React.FC<DefenseSideProps> = ({
  initialOpen = false,
  map,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [defenseDetails, setDefenseDetails] = useState<DefenseDetails[]>([
    createEmptyDefense(),
  ]);
  const [pickingCardId, setPickingCardId] = useState<number | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const polylineRef = useRef<L.Polyline | null>(null);
  const glowPolylineRef = useRef<L.Polyline | null>(null);
  const connectedLocationsCount = defenseDetails.filter((d) => d.location).length;

  const updateDefenseDetails = (
    id: number,
    field: keyof Omit<DefenseDetails, "id">,
    value: string
  ) => {
    setDefenseDetails((prev) =>
      prev.map((detail) =>
        detail.id === id
          ? {
              ...detail,
              [field]: value,
            }
          : detail
      )
    );
  };

  const handleAddDefenseDetails = () => {
    setDefenseDetails((prev) => [...prev, createEmptyDefense()]);
  };

  const removeDefenseDetails = (id: number) => {
    if (pickingCardId === id) {
      setPickingCardId(null);
    }
    const marker = markersRef.current.get(id);
    if (marker) {
      marker.remove();
      markersRef.current.delete(id);
    }
    setDefenseDetails((prev) =>
      prev.length > 1
        ? prev.filter((detail) => detail.id !== id)
        : prev
    );
  };

  const removeLocation = (id: number) => {
    setDefenseDetails((prev) =>
      prev.map((detail) =>
        detail.id === id ? { ...detail, location: undefined } : detail
      )
    );
    if (pickingCardId === id) {
      setPickingCardId(null);
    }
  };

  const startPickingLocation = (cardId: number) => {
    setPickingCardId((prev) => (prev === cardId ? null : cardId));
  };

  const handleSave = () => {
    console.log("Defense side:", {
      defenseDetails,
    });
  };

  const handleCancel = () => {
    setDefenseDetails([createEmptyDefense()]);
    setPickingCardId(null);
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    if (glowPolylineRef.current) {
      glowPolylineRef.current.remove();
      glowPolylineRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    setIsOpen(false);
  };

  // Listen to map click when in location-picking mode
  useEffect(() => {
    if (!map) return;

    if (pickingCardId === null) {
      map.getContainer().style.cursor = "";
      return;
    }

    map.getContainer().style.cursor = "crosshair";

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setDefenseDetails((prev) =>
        prev.map((detail) =>
          detail.id === pickingCardId
            ? { ...detail, location: { lat, lng } }
            : detail
        )
      );
      setPickingCardId(null);
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
      map.getContainer().style.cursor = "";
    };
  }, [map, pickingCardId]);

  // Synchronize Leaflet markers and connecting lines with defenseDetails
  useEffect(() => {
    if (!map) return;

    const currentMarkers = markersRef.current;

    // Remove markers that are no longer present or lack location
    const validIds = new Set(
      defenseDetails.filter((d) => d.location).map((d) => d.id)
    );
    currentMarkers.forEach((marker, id) => {
      if (!validIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Add or update markers for defense cards with location
    defenseDetails.forEach((detail, index) => {
      if (!detail.location) return;

      const { lat, lng } = detail.location;
      const existingMarker = currentMarkers.get(detail.id);

      const popupContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 4px 6px; min-width: 170px; text-align: right;">
          <div style="font-weight: 700; font-size: 14px; color: #102a56; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🛡️</span>
            <span>פרטי הגנה ${index + 1}</span>
          </div>
          ${detail.attackName ? `<div style="font-size: 12px; color: #334155; margin-bottom: 3px;"><strong>שם תקיפה:</strong> ${escapeHtml(detail.attackName)}</div>` : ""}
          ${detail.interceptionType ? `<div style="font-size: 12px; color: #334155; margin-bottom: 3px;"><strong>סוג יירוט:</strong> ${escapeHtml(detail.interceptionType)}</div>` : ""}
          ${detail.interceptors ? `<div style="font-size: 12px; color: #334155; margin-bottom: 3px;"><strong>מיירטים:</strong> ${escapeHtml(detail.interceptors)}</div>` : ""}
          ${detail.border ? `<div style="font-size: 12px; color: #334155; margin-bottom: 3px;"><strong>גבול:</strong> ${escapeHtml(detail.border)}</div>` : ""}
          <div style="font-size: 11px; color: #64748b; margin-top: 6px; direction: ltr; text-align: left;">
            📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `;

      const icon = createInterceptionIcon(index + 1);

      if (existingMarker) {
        existingMarker.setLatLng([lat, lng]);
        existingMarker.setIcon(icon);
        existingMarker.setPopupContent(popupContent);
      } else {
        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(popupContent);
        currentMarkers.set(detail.id, marker);
      }
    });

    // Connect all interception points in this defense side on the map
    const validLocations: [number, number][] = defenseDetails
      .filter(
        (d): d is DefenseDetails & { location: { lat: number; lng: number } } =>
          Boolean(d.location)
      )
      .map((d) => [d.location.lat, d.location.lng]);

    if (validLocations.length >= 2) {
      let totalDistanceMeters = 0;
      for (let i = 0; i < validLocations.length - 1; i++) {
        const p1 = L.latLng(validLocations[i][0], validLocations[i][1]);
        const p2 = L.latLng(validLocations[i + 1][0], validLocations[i + 1][1]);
        totalDistanceMeters += p1.distanceTo(p2);
      }
      const distanceKm = (totalDistanceMeters / 1000).toFixed(1);
      const tooltipContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; color: #102a56; padding: 2px 4px; text-align: right;">
          <span>⚡ רשת יירוט - צד הגנה</span><br/>
          <span style="font-size: 11px; color: #475569; font-weight: 400;">
            ${validLocations.length} נקודות מקושרות • ${distanceKm} ק״מ
          </span>
        </div>
      `;

      if (glowPolylineRef.current) {
        glowPolylineRef.current.setLatLngs(validLocations);
      } else {
        glowPolylineRef.current = L.polyline(validLocations, {
          color: "#38bdf8",
          weight: 7,
          opacity: 0.35,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }

      if (polylineRef.current) {
        polylineRef.current.setLatLngs(validLocations);
        polylineRef.current.setTooltipContent(tooltipContent);
      } else {
        polylineRef.current = L.polyline(validLocations, {
          className: "defense-connection-line",
          color: "#1765b5",
          weight: 3.5,
          opacity: 0.95,
          dashArray: "10, 10",
          lineCap: "round",
          lineJoin: "round",
        })
          .addTo(map)
          .bindTooltip(tooltipContent, { sticky: true, direction: "top" });
      }
    } else {
      if (glowPolylineRef.current) {
        glowPolylineRef.current.remove();
        glowPolylineRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
    }
  }, [map, defenseDetails]);

  // Clean up all markers and connection lines on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      if (glowPolylineRef.current) {
        glowPolylineRef.current.remove();
        glowPolylineRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes defenseSideSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .defense-side-open-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(16, 42, 86, 0.35) !important;
        }
        .defense-side-open-btn:active {
          transform: translateY(0);
        }
        .defense-side-close-btn:hover {
          background: rgba(255, 255, 255, 0.22) !important;
        }
        .interception-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        @keyframes interceptionPulse {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          70% {
            transform: scale(1.45);
            opacity: 0;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
        @keyframes defenseBannerPulse {
          0%, 100% {
            box-shadow: 0 10px 30px rgba(16, 42, 86, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 10px 35px rgba(23, 101, 181, 0.65), 0 0 0 2px rgba(56, 189, 248, 0.6);
          }
        }
        @keyframes defenseDashFlow {
          from {
            stroke-dashoffset: 40;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .defense-connection-line {
          animation: defenseDashFlow 1.8s linear infinite;
        }
      `}</style>

      {/* Floating Picking Banner */}
      {pickingCardId !== null && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1200,
            background: "linear-gradient(135deg, #102a56 0%, #175ca8 100%)",
            color: "#fff",
            padding: "11px 22px",
            borderRadius: "12px",
            boxShadow:
              "0 10px 30px rgba(16, 42, 86, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "Arial, Helvetica, sans-serif",
            animation: "defenseBannerPulse 2s infinite ease-in-out",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🎯
          </div>
          <span>
            לחץ על מיקום במפה להוספת אייקון יירוט עבור פרטי הגנה{" "}
            {defenseDetails.findIndex((d) => d.id === pickingCardId) + 1}
          </span>
          <button
            type="button"
            onClick={() => setPickingCardId(null)}
            style={{
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "7px",
              color: "#fff",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ביטול
          </button>
        </div>
      )}

      {/* Button to open DefenseSide */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="defense-side-open-btn"
          aria-label="פתח צד הגנה"
          title="פתח צד הגנה"
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 20px",
            background:
              "linear-gradient(135deg, #102a56 0%, #174b91 100%)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(16, 42, 86, 0.25)",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "Arial, Helvetica, sans-serif",
            direction: "rtl",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🛡
          </div>
          <span>יצירת צד ההגנה</span>
        </button>
      )}

      {/* Defense Side Panel */}
      {isOpen && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            bottom: "24px",
            width: "460px",
            maxWidth: "calc(100vw - 48px)",
            background: "#f5f7fa",
            borderRadius: "16px",
            boxShadow: "0 18px 50px rgba(15, 30, 55, 0.22)",
            border: "1px solid #dce2ea",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily:
              "Arial, Helvetica, sans-serif",
            color: "#172033",
            zIndex: 1100,
            animation:
              "defenseSideSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #102a56 0%, #174b91 100%)",
              padding: "22px 24px",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "13px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "21px",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  🛡
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    יצירת צד ההגנה 
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#cbd9ed",
                    }}
                  >
                    הגדרת מערך ההגנה והיירוט
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="defense-side-close-btn"
                aria-label="סגור צד הגנה"
                title="סגור"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  transition: "background 0.2s ease",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
            }}
          >
            {/* Section title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#16243a",
                  }}
                >
                  פרטי הגנה
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "12px",
                    color: "#748096",
                  }}
                >
                  הגדר את אמצעי ההגנה והיירוט
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {connectedLocationsCount >= 2 && (
                  <div
                    style={{
                      height: "30px",
                      padding: "0 10px",
                      borderRadius: "7px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      border: "1px solid #bae6fd",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                    title="כל נקודות היירוט מקושרות ברשת על גבי המפה"
                  >
                    <span>🔗</span>
                    <span>{connectedLocationsCount} מקושרים במפה</span>
                  </div>
                )}

                <div
                  style={{
                    minWidth: "30px",
                    height: "30px",
                    padding: "0 8px",
                    borderRadius: "7px",
                    background: "#e8f0fb",
                    color: "#17539b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {defenseDetails.length}
                </div>
              </div>
            </div>

            {/* Defense cards */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {defenseDetails.map((detail, index) => (
                <div
                  key={detail.id}
                  style={{
                    position: "relative",
                    background: "#fff",
                    border: "1px solid #dce3ec",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 4px 14px rgba(20, 40, 70, 0.06)",
                    overflow: "hidden",
                  }}
                >
                  {/* Blue accent */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: "4px",
                      background:
                        "linear-gradient(180deg, #1769c2, #1c8be0)",
                    }}
                  />

                  {/* Card header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          background: "#edf4fc",
                          color: "#1762ad",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {index + 1}
                      </div>

                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1b2a40",
                        }}
                      >
                        פרטי הגנה {index + 1}
                      </div>
                    </div>

                    {defenseDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeDefenseDetails(detail.id)
                        }
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          border: "1px solid #e1e5eb",
                          background: "#fff",
                          color: "#8792a3",
                          cursor: "pointer",
                          fontSize: "18px",
                          lineHeight: 1,
                        }}
                        title="הסר פרטי הגנה"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Attack name */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>
                      שם תקיפת יירוט
                    </label>

                    <input
                      type="text"
                      value={detail.attackName}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "attackName",
                          e.target.value
                        )
                      }
                      placeholder="הכנס שם תקיפה..."
                      style={inputStyle}
                    />
                  </div>

                  {/* Interception type */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>
                      סוג היירוט
                    </label>

                    <select
                      value={detail.interceptionType}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "interceptionType",
                          e.target.value
                        )
                      }
                      style={selectStyle}
                    >
                      <option value="">
                        בחר סוג יירוט...
                      </option>

                      {interceptionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>
                      הסבר על ההגנה
                    </label>

                    <textarea
                      value={detail.description}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="הכנס הסבר על ההגנה..."
                      style={textareaStyle}
                    />
                  </div>

                  {/* Interceptors */}
                  <div style={{ marginBottom: "15px" }}>
                    <label style={labelStyle}>
                      מיירטים
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={detail.interceptors}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "interceptors",
                          e.target.value
                        )
                      }
                      placeholder="מספר מיירטים"
                      style={inputStyle}
                    />
                  </div>

                  {/* Border */}
                  <div>
                    <label style={labelStyle}>
                      מאיזה גבולות
                    </label>

                    <select
                      value={detail.border}
                      onChange={(e) =>
                        updateDefenseDetails(
                          detail.id,
                          "border",
                          e.target.value
                        )
                      }
                      style={selectStyle}
                    >
                      <option value="">
                        בחר גבול...
                      </option>

                      {borders.map((border) => (
                        <option key={border} value={border}>
                          {border}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Interception Location */}
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "14px",
                      borderTop: "1px dashed #dbe2ec",
                    }}
                  >
                    <label style={labelStyle}>
                      מיקום יירוט במפה
                    </label>

                    {detail.location ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background: "#f0f7ff",
                            border: "1px solid #c8dff7",
                            fontSize: "13px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: "#134e8d",
                              fontWeight: 600,
                            }}
                          >
                            <span style={{ fontSize: "16px" }}>🎯</span>
                            <span>
                              {detail.location.lat.toFixed(4)},{" "}
                              {detail.location.lng.toFixed(4)}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "6px" }}>
                            {map && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (detail.location && map) {
                                    map.setView(
                                      [
                                        detail.location.lat,
                                        detail.location.lng,
                                      ],
                                      Math.max(map.getZoom(), 8),
                                      { animate: true }
                                    );
                                    const m = markersRef.current.get(detail.id);
                                    if (m) m.openPopup();
                                  }
                                }}
                                title="התמקד במפה"
                                style={{
                                  background: "#fff",
                                  border: "1px solid #b9d5f3",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  color: "#1762ad",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                              >
                                הצג
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeLocation(detail.id)}
                              title="הסר מיקום יירוט"
                              style={{
                                background: "#fff",
                                border: "1px solid #fecaca",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                fontSize: "12px",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              הסר
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => startPickingLocation(detail.id)}
                          style={{
                            width: "100%",
                            height: "36px",
                            borderRadius: "7px",
                            border:
                              pickingCardId === detail.id
                                ? "1.5px solid #1765b5"
                                : "1px solid #d5dce7",
                            background:
                              pickingCardId === detail.id
                                ? "#e8f2fe"
                                : "#fff",
                            color:
                              pickingCardId === detail.id
                                ? "#1765b5"
                                : "#4a5568",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <span>🎯</span>
                          <span>
                            {pickingCardId === detail.id
                              ? "לחץ על המפה לשינוי מיקום (או לחץ לביטול)"
                              : "שנה מיקום במפה"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startPickingLocation(detail.id)}
                        style={{
                          width: "100%",
                          height: "40px",
                          borderRadius: "8px",
                          border:
                            pickingCardId === detail.id
                              ? "2px solid #1765b5"
                              : "1px solid #b8d2ee",
                          background:
                            pickingCardId === detail.id
                              ? "#eaf3fd"
                              : "linear-gradient(180deg, #f7faff 0%, #edf5fd 100%)",
                          color:
                            pickingCardId === detail.id
                              ? "#0f4c8a"
                              : "#175ca8",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "7px",
                          boxShadow:
                            pickingCardId === detail.id
                              ? "0 0 0 3px rgba(23, 101, 181, 0.2)"
                              : "0 2px 5px rgba(23, 92, 168, 0.08)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>🎯</span>
                        <span>
                          {pickingCardId === detail.id
                            ? "לחץ על המפה להוספת אייקון... (ביטול)"
                            : "הוסף מיקום יירוט במפה"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={handleAddDefenseDetails}
              style={{
                width: "100%",
                height: "46px",
                marginTop: "16px",
                borderRadius: "9px",
                border: "1px dashed #8ca9c8",
                background: "#f8fbff",
                color: "#14599f",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                +
              </span>

              הוסף פרטי הגנה
            </button>
          </div>

          {/* Footer */}
          <div
            style={{
              flexShrink: 0,
              padding: "15px 20px",
              background: "#fff",
              borderTop: "1px solid #dfe4eb",
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1,
                height: "44px",
                borderRadius: "8px",
                border: "1px solid #d6dce5",
                background: "#fff",
                color: "#4e5b6d",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ביטול
            </button>

            <button
              type="button"
              onClick={handleSave}
              style={{
                flex: 1.5,
                height: "44px",
                borderRadius: "8px",
                border: "none",
                background:
                  "linear-gradient(135deg, #1765b5, #1d7ed0)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
                boxShadow: "0 5px 12px rgba(23, 101, 181, 0.22)",
              }}
            >
              שמור צד הגנה
            </button>
          </div>
        </div>
      )}
    </>
  );
};