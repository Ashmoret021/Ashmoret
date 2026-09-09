import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";

export type DefenseDetails = {
  id: number;

  // פרטי הגנה
  description: string;
  border: string;
  interceptionType: string;

  // נתוני מערכת
  simulatedSystemName: string;
  systemCount: string;

  // נתוני מיירט
  simulatedInterceptorName: string;
  interceptorsPerSystem: string;
  totalInterceptors: string;
  interceptorCost: string;
  estimatedInterceptSuccessRate: string;
  operationalRange: string;

  // גובה
  altitudeAsl: string;
  altitudeAgl: string;

  // מיקום במפה
  location?: {
    lat: number;
    lng: number;
  };
  manualLat?: string;
  manualLng?: string;
};

const borders = ["עזה", "לבנון"];

const interceptionTypes = [
  "יירוט אווירי",
  "יירוט בליסטי",
  "יירוט טילי שיוט",
  "יירוט רחפנים",
];

/* =========================================================
   מערכות מסחריות מדומות + המיירטים שלהן
========================================================= */

const defenseSystems = [
  "ShieldNest-Lite",
  "IronHook-SR",
  "HorizonEye-MX",
  "CloudFence-Area",
];

const interceptorOptions: Record<string, string[]> = {
  "ShieldNest-Lite": [
    "BuzzStop-15",
    "NetWing-30",
  ],

  "IronHook-SR": [
    "DartFox-S",
    "SpearMini-70",
  ],

  "HorizonEye-MX": [
    "SkyLance-M",
    "FalconClip-H",
  ],

  "CloudFence-Area": [
    "SwarmMist-5",
    "MicroNet-R",
  ],
};

/* =========================================================
   יצירת כרטיס הגנה ריק
========================================================= */

const createEmptyDefense = (): DefenseDetails => ({
  id: Date.now() + Math.random(),

  description: "",
  border: "",
  interceptionType: "",

  simulatedSystemName: "",
  systemCount: "",

  simulatedInterceptorName: "",
  interceptorsPerSystem: "",
  totalInterceptors: "",
  interceptorCost: "",
  estimatedInterceptSuccessRate: "",
  operationalRange: "",

  altitudeAsl: "",
  altitudeAgl: "",

  location: undefined,
  manualLat: "",
  manualLng: "",
});

export interface DefenseSideProps {
  initialOpen?: boolean;
  map?: L.Map | null;
}

/* =========================================================
   Styles
========================================================= */

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "38px",
  padding: "0 11px",
  borderRadius: "7px",
  border: "1px solid #d8e0ea",
  background: "#fff",
  color: "#172033",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  direction: "rtl",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: "70px",
  padding: "10px 11px",
  resize: "vertical",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "5px",
  color: "#475569",
  fontSize: "11.5px",
  fontWeight: 600,
  direction: "rtl",
};

const sectionTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginTop: "4px",
  marginBottom: "12px",
  paddingBottom: "7px",
  borderBottom: "1px solid #edf1f5",
  color: "#526176",
  fontSize: "12px",
  fontWeight: 700,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: "11px",
};

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

/* =========================================================
   Marker
========================================================= */

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
      ">

        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(23, 101, 181, 0.25);
          animation: interceptionPulse 2s infinite ease-out;
        "></div>

        <div style="
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #102a56 0%, #1765b5 100%);
          border: 2px solid #ffffff;
          box-shadow:
            0 4px 14px rgba(16, 42, 86, 0.45),
            0 0 12px rgba(23, 101, 181, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        ">

          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="8.5"
              stroke="#ffffff"
              stroke-width="1.6"
              stroke-dasharray="2 2"
              opacity="0.85"
            />

            <circle
              cx="12"
              cy="12"
              r="4.5"
              fill="#38bdf8"
              fill-opacity="0.35"
              stroke="#38bdf8"
              stroke-width="1.5"
            />

            <path
              d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"
              stroke="#ffffff"
              stroke-width="1.6"
              stroke-linecap="round"
            />

            <circle
              cx="12"
              cy="12"
              r="2"
              fill="#ffffff"
            />
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

/* =========================================================
   Component
========================================================= */

export const DefenseSide: React.FC<DefenseSideProps> = ({
  initialOpen = false,
  map,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const [defenseDetails, setDefenseDetails] = useState<
    DefenseDetails[]
  >([createEmptyDefense()]);

  const [pickingCardId, setPickingCardId] = useState<
    number | null
  >(null);

  const markersRef = useRef<Map<number, L.Marker>>(
    new Map()
  );

  /* =========================================================
     עדכון שדה רגיל
  ========================================================= */

  const updateDefenseDetails = (
    id: number,
    field: keyof DefenseDetails,
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

  /* =========================================================
     בחירת מערכת

     כשבוחרים מערכת חדשה:
     - המערכת מתעדכנת
     - המיירט הקודם מתאפס
  ========================================================= */

  const handleSystemChange = (
    id: number,
    systemName: string
  ) => {
    setDefenseDetails((prev) =>
      prev.map((detail) =>
        detail.id === id
          ? {
              ...detail,
              simulatedSystemName: systemName,
              simulatedInterceptorName: "",
            }
          : detail
      )
    );
  };

  /* =========================================================
     חישוב סה"כ מיירטים

     כמות מערכות × מיירטים לכל מערכת
  ========================================================= */

  const calculateTotalInterceptors = (
    systemCount: string,
    interceptorsPerSystem: string
  ) => {
    if (
      systemCount === "" ||
      interceptorsPerSystem === ""
    ) {
      return "";
    }

    const systems = Number(systemCount);

    const interceptors = Number(
      interceptorsPerSystem
    );

    if (
      !Number.isFinite(systems) ||
      !Number.isFinite(interceptors)
    ) {
      return "";
    }

    return String(
      systems * interceptors
    );
  };

  /* =========================================================
     שינוי כמות מערכות
  ========================================================= */

  const handleSystemCountChange = (
    id: number,
    value: string
  ) => {
    setDefenseDetails((prev) =>
      prev.map((detail) => {
        if (detail.id !== id) {
          return detail;
        }

        return {
          ...detail,

          systemCount: value,

          totalInterceptors:
            calculateTotalInterceptors(
              value,
              detail.interceptorsPerSystem
            ),
        };
      })
    );
  };

  /* =========================================================
     שינוי מיירטים לכל מערכת
  ========================================================= */

  const handleInterceptorsPerSystemChange = (
    id: number,
    value: string
  ) => {
    setDefenseDetails((prev) =>
      prev.map((detail) => {
        if (detail.id !== id) {
          return detail;
        }

        return {
          ...detail,

          interceptorsPerSystem: value,

          totalInterceptors:
            calculateTotalInterceptors(
              detail.systemCount,
              value
            ),
        };
      })
    );
  };

  /* =========================================================
     הוספת כרטיס הגנה
  ========================================================= */

  const handleAddDefenseDetails = () => {
    setDefenseDetails((prev) => [
      ...prev,
      createEmptyDefense(),
    ]);
  };

  /* =========================================================
     מחיקת כרטיס הגנה
  ========================================================= */

  const removeDefenseDetails = (
    id: number
  ) => {
    if (pickingCardId === id) {
      setPickingCardId(null);
    }

    const marker =
      markersRef.current.get(id);

    if (marker) {
      marker.remove();

      markersRef.current.delete(id);
    }

    setDefenseDetails((prev) =>
      prev.length > 1
        ? prev.filter(
            (detail) => detail.id !== id
          )
        : prev
    );
  };

  /* =========================================================
     שינוי קואורדינטות ידניות
  ========================================================= */

  const handleManualCoordinateChange = (
    id: number,
    coord: "lat" | "lng",
    value: string
  ) => {
    setDefenseDetails((prev) =>
      prev.map((detail) => {
        if (detail.id !== id) return detail;

        if (coord === "lat") {
          return {
            ...detail,
            manualLat: value,
          };
        } else {
          return {
            ...detail,
            manualLng: value,
          };
        }
      })
    );
  };

  /* =========================================================
     החלת קואורדינטות ידניות על המפה
  ========================================================= */

  const applyManualCoordinates = (id: number) => {
    const card = defenseDetails.find(
      (d) => d.id === id
    );

    if (!card) return;

    const latStr =
      card.manualLat !== undefined &&
      card.manualLat !== ""
        ? card.manualLat
        : card.location
        ? String(card.location.lat)
        : "";

    const lngStr =
      card.manualLng !== undefined &&
      card.manualLng !== ""
        ? card.manualLng
        : card.location
        ? String(card.location.lng)
        : "";

    if (
      !latStr.trim() ||
      !lngStr.trim()
    ) {
      alert(
        "אנא הזן ערכי X (קו אורך) ו-Y (קו רוחב)"
      );

      return;
    }

    const lat = parseFloat(
      latStr.trim()
    );

    const lng = parseFloat(
      lngStr.trim()
    );

    if (
      isNaN(lat) ||
      isNaN(lng)
    ) {
      alert(
        "אנא הזן ערכי קואורדינטות תקינים (מספרים)"
      );

      return;
    }

    setDefenseDetails((prev) =>
      prev.map((detail) =>
        detail.id === id
          ? {
              ...detail,

              location: {
                lat,
                lng,
              },

              manualLat: String(lat),
              manualLng: String(lng),
            }
          : detail
      )
    );

    if (pickingCardId === id) {
      setPickingCardId(null);
    }

    if (map) {
      map.setView(
        [lat, lng],
        Math.max(
          map.getZoom(),
          8
        ),
        {
          animate: true,
        }
      );
    }
  };

  /* =========================================================
     הסרת מיקום
  ========================================================= */

  const removeLocation = (
    id: number
  ) => {
    setDefenseDetails((prev) =>
      prev.map((detail) =>
        detail.id === id
          ? {
              ...detail,

              location:
                undefined,

              manualLat:
                "",

              manualLng:
                "",
            }
          : detail
      )
    );

    if (pickingCardId === id) {
      setPickingCardId(null);
    }
  };

  /* =========================================================
     התחלת בחירת מיקום במפה
  ========================================================= */

  const startPickingLocation = (
    cardId: number
  ) => {
    setPickingCardId((prev) =>
      prev === cardId
        ? null
        : cardId
    );
  };

  /* =========================================================
     שמירה
  ========================================================= */

  const handleSave = () => {
    console.log(
      "Defense side:",
      {
        defenseDetails,
      }
    );

    setIsOpen(false);
  };

  /* =========================================================
     ביטול
  ========================================================= */

  const handleCancel = () => {
    setDefenseDetails([
      createEmptyDefense(),
    ]);

    setPickingCardId(null);

    markersRef.current.forEach(
      (marker) => marker.remove()
    );

    markersRef.current.clear();

    setIsOpen(false);
  };

  /* =========================================================
     Map click
  ========================================================= */

  useEffect(() => {
    if (!map) {
      return;
    }

    if (pickingCardId === null) {
      map.getContainer().style.cursor =
        "";

      return;
    }

    map.getContainer().style.cursor =
      "crosshair";

    const handleMapClick = (
      e: L.LeafletMouseEvent
    ) => {
      const {
        lat,
        lng,
      } = e.latlng;

      setDefenseDetails((prev) =>
        prev.map((detail) =>
          detail.id === pickingCardId
            ? {
                ...detail,

                location: {
                  lat,
                  lng,
                },

                manualLat:
                  lat.toFixed(4),

                manualLng:
                  lng.toFixed(4),
              }
            : detail
        )
      );

      setPickingCardId(null);
    };

    map.on(
      "click",
      handleMapClick
    );

    return () => {
      map.off(
        "click",
        handleMapClick
      );

      map.getContainer().style.cursor =
        "";
    };
  }, [
    map,
    pickingCardId,
  ]);

  /* =========================================================
     Map markers
     
     אין קווי חיבור בין נקודות
  ========================================================= */

  useEffect(() => {
    if (!map) {
      return;
    }

    const currentMarkers =
      markersRef.current;

    const validIds = new Set(
      defenseDetails
        .filter(
          (detail) =>
            detail.location
        )
        .map(
          (detail) =>
            detail.id
        )
    );

    currentMarkers.forEach(
      (marker, id) => {
        if (!validIds.has(id)) {
          marker.remove();

          currentMarkers.delete(id);
        }
      }
    );

    defenseDetails.forEach(
      (
        detail,
        index
      ) => {
        if (!detail.location) {
          return;
        }

        const {
          lat,
          lng,
        } = detail.location;

        const existingMarker =
          currentMarkers.get(
            detail.id
          );

        const popupContent = `
          <div
            dir="rtl"
            style="
              font-family: Arial, sans-serif;
              padding: 4px 6px;
              min-width: 230px;
              text-align: right;
            "
          >

            <div
              style="
                font-weight: 700;
                font-size: 14px;
                color: #102a56;
                margin-bottom: 8px;
              "
            >
              🛡️ פרטי הגנה ${index + 1}
            </div>

            ${
              detail.simulatedSystemName
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      מערכת:
                    </strong>
                    ${detail.simulatedSystemName}
                  </div>
                `
                : ""
            }

            ${
              detail.simulatedInterceptorName
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      מיירט:
                    </strong>
                    ${detail.simulatedInterceptorName}
                  </div>
                `
                : ""
            }

            ${
              detail.totalInterceptors
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      סה"כ מיירטים:
                    </strong>
                    ${detail.totalInterceptors}
                  </div>
                `
                : ""
            }

            ${
              detail.interceptorCost
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      עלות מיירט:
                    </strong>
                    ${detail.interceptorCost}
                  </div>
                `
                : ""
            }

            ${
              detail.estimatedInterceptSuccessRate
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      הצלחת יירוט:
                    </strong>
                    ${detail.estimatedInterceptSuccessRate}%
                  </div>
                `
                : ""
            }

            ${
              detail.operationalRange
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      טווח:
                    </strong>
                    ${detail.operationalRange}
                  </div>
                `
                : ""
            }

            ${
              detail.interceptionType
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      סוג:
                    </strong>
                    ${detail.interceptionType}
                  </div>
                `
                : ""
            }

            ${
              detail.altitudeAsl
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      גובה ASL:
                    </strong>
                    ${detail.altitudeAsl} מ׳
                  </div>
                `
                : ""
            }

            ${
              detail.altitudeAgl
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      גובה AGL:
                    </strong>
                    ${detail.altitudeAgl} מ׳
                  </div>
                `
                : ""
            }

            ${
              detail.border
                ? `
                  <div style="
                    font-size: 12px;
                    color: #334155;
                    margin-bottom: 4px;
                  ">
                    <strong>
                      גבול:
                    </strong>
                    ${detail.border}
                  </div>
                `
                : ""
            }

            <div
              style="
                font-size: 11px;
                color: #64748b;
                margin-top: 8px;
                direction: ltr;
                text-align: left;
              "
            >
              📍 ${lat.toFixed(4)},
              ${lng.toFixed(4)}
            </div>

          </div>
        `;

        const icon =
          createInterceptionIcon(
            index + 1
          );

        if (existingMarker) {
          existingMarker.setLatLng([
            lat,
            lng,
          ]);

          existingMarker.setIcon(
            icon
          );

          existingMarker.setPopupContent(
            popupContent
          );
        } else {
          const marker =
            L.marker(
              [lat, lng],
              {
                icon,
              }
            )
              .addTo(map)
              .bindPopup(
                popupContent
              );

          currentMarkers.set(
            detail.id,
            marker
          );
        }
      }
    );
  }, [
    map,
    defenseDetails,
  ]);

  /* =========================================================
     Cleanup
  ========================================================= */

  useEffect(() => {
    return () => {
      markersRef.current.forEach(
        (marker) =>
          marker.remove()
      );

      markersRef.current.clear();
    };
  }, []);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <style>{`

        /* =========================================
           Animations
        ========================================= */

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

        /* =========================================
           Open Button
        ========================================= */

        .defense-side-open-btn:hover {
          transform: translateY(-2px);

          box-shadow:
            0 12px 28px
            rgba(16, 42, 86, 0.35) !important;
        }

        .defense-side-open-btn:active {
          transform: translateY(0);
        }

        /* =========================================
           Close Button
        ========================================= */

        .defense-side-close-btn:hover {
          background:
            rgba(255, 255, 255, 0.22) !important;
        }

        /* =========================================
           Inputs
        ========================================= */

        .defense-input:focus,
        .defense-select:focus {
          border-color:
            #1765b5 !important;

          box-shadow:
            0 0 0 3px
            rgba(23, 101, 181, 0.10) !important;
        }

        .defense-input::placeholder {
          color: #a1acba;
        }

        /* =========================================
           Scrollbar
        ========================================= */

        .defense-side-content::-webkit-scrollbar {
          width: 6px;
        }

        .defense-side-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .defense-side-content::-webkit-scrollbar-thumb {
          background: #c8d1dd;
          border-radius: 10px;
        }

        .defense-side-content::-webkit-scrollbar-thumb:hover {
          background: #aeb9c8;
        }

        /* =========================================
           Marker
        ========================================= */

        .interception-marker-icon {
          background: transparent !important;
          border: none !important;
        }

      `}</style>

      {/* =====================================================
          Banner בזמן בחירת מיקום
      ===================================================== */}

      {pickingCardId !== null && (
        <div
          dir="rtl"
          style={{
            position: "fixed",

            top: "24px",
            left: "50%",

            transform:
              "translateX(-50%)",

            zIndex: 1200,

            background:
              "linear-gradient(135deg, #102a56 0%, #175ca8 100%)",

            color: "#fff",

            padding:
              "10px 18px",

            borderRadius: "10px",

            boxShadow:
              "0 10px 30px rgba(16, 42, 86, 0.4)",

            display: "flex",

            alignItems: "center",

            gap: "12px",

            fontSize: "13px",

            fontWeight: 600,

            fontFamily:
              "Arial, Helvetica, sans-serif",

            animation:
              "defenseSideSlideIn 0.25s ease-out",
          }}
        >
          <div
            style={{
              width: "27px",
              height: "27px",
              borderRadius: "50%",
              background:
                "rgba(255, 255, 255, 0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🎯
          </div>

          <span>
            לחץ על המפה לבחירת מיקום היירוט
          </span>

          <button
            type="button"
            onClick={() =>
              setPickingCardId(null)
            }
            style={{
              background:
                "rgba(255, 255, 255, 0.16)",

              border:
                "1px solid rgba(255,255,255,0.25)",

              borderRadius:
                "6px",

              color: "#fff",

              padding:
                "5px 10px",

              fontSize: "11px",

              fontWeight: 700,

              cursor: "pointer",
            }}
          >
            ביטול
          </button>
        </div>
      )}

      {/* =====================================================
          כפתור פתיחת המודל
      ===================================================== */}

      {!isOpen && (
        <button
          type="button"
          onClick={() =>
            setIsOpen(true)
          }
          className="defense-side-open-btn"
          style={{
            position: "fixed",

            top: "24px",
            right: "24px",

            zIndex: 1100,

            display: "flex",

            alignItems: "center",

            gap: "9px",

            padding:
              "11px 18px",

            background:
              "linear-gradient(135deg, #102a56 0%, #174b91 100%)",

            color: "#fff",

            border:
              "1px solid rgba(255, 255, 255, 0.18)",

            borderRadius: "10px",

            boxShadow:
              "0 8px 24px rgba(16, 42, 86, 0.25)",

            cursor: "pointer",

            fontSize: "14px",

            fontWeight: 700,

            fontFamily:
              "Arial, Helvetica, sans-serif",

            direction: "rtl",

            transition:
              "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          <div
            style={{
              width: "27px",
              height: "27px",
              borderRadius: "7px",

              background:
                "rgba(255, 255, 255, 0.15)",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              fontSize: "15px",
            }}
          >
            🛡
          </div>

          <span>
            יצירת צד ההגנה
          </span>
        </button>
      )}

      {/* =====================================================
          Defense Panel
      ===================================================== */}

      {isOpen && (
        <div
          dir="rtl"
          style={{
            position: "fixed",

            top: "24px",
            right: "24px",
            bottom: "24px",

            width: "460px",

            maxWidth:
              "calc(100vw - 48px)",

            background:
              "#f5f7fa",

            borderRadius:
              "16px",

            boxShadow:
              "0 18px 50px rgba(15, 30, 55, 0.22)",

            border:
              "1px solid #dce2ea",

            overflow:
              "hidden",

            display:
              "flex",

            flexDirection:
              "column",

            fontFamily:
              "Arial, Helvetica, sans-serif",

            color:
              "#172033",

            zIndex:
              1100,

            animation:
              "defenseSideSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >

          {/* =================================================
              Header
          ================================================= */}

          <div
            style={{
              background:
                "linear-gradient(135deg, #102a56 0%, #174b91 100%)",

              padding:
                "18px 20px",

              color:
                "#fff",

              flexShrink:
                0,
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                gap:
                  "12px",
              }}
            >

              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    "11px",
                }}
              >

                <div
                  style={{
                    width:
                      "38px",

                    height:
                      "38px",

                    borderRadius:
                      "9px",

                    background:
                      "rgba(255,255,255,0.12)",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "19px",

                    border:
                      "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  🛡
                </div>

                <div>

                  <div
                    style={{
                      fontSize:
                        "18px",

                      fontWeight:
                        700,
                    }}
                  >
                    יצירת צד ההגנה
                  </div>

                  <div
                    style={{
                      marginTop:
                        "3px",

                      fontSize:
                        "11px",

                      color:
                        "#cbd9ed",
                    }}
                  >
                    הגדרת מערך ההגנה והיירוט
                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setIsOpen(false)
                }
                className="defense-side-close-btn"
                style={{
                  width:
                    "34px",

                  height:
                    "34px",

                  borderRadius:
                    "8px",

                  border:
                    "1px solid rgba(255,255,255,0.2)",

                  background:
                    "rgba(255,255,255,0.12)",

                  color:
                    "#fff",

                  cursor:
                    "pointer",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  fontSize:
                    "15px",

                  transition:
                    "background 0.2s ease",
                }}
              >
                ✕
              </button>

            </div>
          </div>

          {/* =================================================
              Content
          ================================================= */}

          <div
            className="defense-side-content"
            style={{
              flex:
                1,

              overflowY:
                "auto",

              padding:
                "16px",
            }}
          >

            {/* =================================================
                Page heading
            ================================================= */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                marginBottom:
                  "13px",
              }}
            >

              <div>

                <div
                  style={{
                    fontSize:
                      "16px",

                    fontWeight:
                      700,

                    color:
                      "#16243a",
                  }}
                >
                  פרטי היירוט
                </div>

                <div
                  style={{
                    marginTop:
                      "3px",

                    fontSize:
                      "11px",

                    color:
                      "#748096",
                  }}
                >
                  הגדרת נתוני המערכת והמיירט
                </div>

              </div>

              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    "7px",
                }}
              >

                <div
                  style={{
                    minWidth:
                      "28px",

                    height:
                      "28px",

                    padding:
                      "0 7px",

                    borderRadius:
                      "7px",

                    background:
                      "#e8f0fb",

                    color:
                      "#17539b",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "11px",

                    fontWeight:
                      700,
                  }}
                >
                  {
                    defenseDetails.length
                  }
                </div>

              </div>

            </div>

            {/* =================================================
                Defense cards
            ================================================= */}

            <div
              style={{
                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "12px",
              }}
            >

              {defenseDetails.map(
                (
                  detail,
                  index
                ) => (

                  <div
                    key={
                      detail.id
                    }
                    style={{
                      position:
                        "relative",

                      background:
                        "#fff",

                      border:
                        "1px solid #dce3ec",

                      borderRadius:
                        "11px",

                      padding:
                        "15px",

                      boxShadow:
                        "0 3px 12px rgba(20, 40, 70, 0.055)",

                      overflow:
                        "hidden",
                    }}
                  >

                    {/* פס כחול בצד */}

                    <div
                      style={{
                        position:
                          "absolute",

                        top:
                          0,

                        right:
                          0,

                        bottom:
                          0,

                        width:
                          "3px",

                        background:
                          "linear-gradient(180deg, #1769c2, #1c8be0)",
                      }}
                    />

                    {/* =================================================
                        Card Header
                    ================================================= */}

                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "space-between",

                        marginBottom:
                          "14px",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            "8px",
                        }}
                      >

                        <div
                          style={{
                            width:
                              "27px",

                            height:
                              "27px",

                            borderRadius:
                              "7px",

                            background:
                              "#edf4fc",

                            color:
                              "#1762ad",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            fontSize:
                              "12px",

                            fontWeight:
                              700,
                          }}
                        >
                          {
                            index + 1
                          }
                        </div>

                        <div
                          style={{
                            fontSize:
                              "14px",

                            fontWeight:
                              700,

                            color:
                              "#1b2a40",
                          }}
                        >
                          פרטי היירוט{" "}
                          {
                            index + 1
                          }
                        </div>

                      </div>

                      {defenseDetails.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeDefenseDetails(
                              detail.id
                            )
                          }
                          style={{
                            width:
                              "28px",

                            height:
                              "28px",

                            borderRadius:
                              "7px",

                            border:
                              "1px solid #e1e5eb",

                            background:
                              "#fff",

                            color:
                              "#8792a3",

                            cursor:
                              "pointer",

                            fontSize:
                              "17px",

                            lineHeight:
                              1,
                          }}
                        >
                          ×
                        </button>
                      )}

                    </div>

                    {/* =================================================
                        פרטי מערכת
                    ================================================= */}

                    <div
                      style={
                        sectionTitleStyle
                      }
                    >
                      <span
                        style={{
                          fontSize:
                            "13px",
                        }}
                      >
                        ◈
                      </span>

                      <span>
                        פרטי מערכת
                      </span>
                    </div>

                    {/* שם מערכת + מיירט באותה שורה */}

                    <div
                      style={
                        rowStyle
                      }
                    >

                      {/* שם מערכת */}

                      <div
                        style={
                          fieldStyle
                        }
                      >
                        <label
                          style={
                            labelStyle
                          }
                        >
                          שם מערכת מסחרי מדומה
                        </label>

                        <select
                          value={
                            detail.simulatedSystemName
                          }
                          onChange={(e) =>
                            handleSystemChange(
                              detail.id,
                              e.target.value
                            )
                          }
                          className="defense-select"
                          style={
                            selectStyle
                          }
                        >
                          <option value="">
                            בחר מערכת...
                          </option>

                          {defenseSystems.map(
                            (
                              system
                            ) => (
                              <option
                                key={
                                  system
                                }
                                value={
                                  system
                                }
                              >
                                {
                                  system
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {/* שם מיירט */}

                      <div
                        style={
                          fieldStyle
                        }
                      >
                        <label
                          style={
                            labelStyle
                          }
                        >
                          שם מיירט מסחרי מדומה
                        </label>

                        <select
                          value={
                            detail.simulatedInterceptorName
                          }
                          onChange={(e) =>
                            updateDefenseDetails(
                              detail.id,
                              "simulatedInterceptorName",
                              e.target.value
                            )
                          }
                          disabled={
                            !detail.simulatedSystemName
                          }
                          className="defense-select"
                          style={{
                            ...selectStyle,

                            background:
                              detail.simulatedSystemName
                                ? "#fff"
                                : "#f4f6f8",

                            color:
                              detail.simulatedSystemName
                                ? "#172033"
                                : "#9aa4b2",

                            cursor:
                              detail.simulatedSystemName
                                ? "pointer"
                                : "not-allowed",
                          }}
                        >
                          <option value="">
                            {detail.simulatedSystemName
                              ? "בחר מיירט..."
                              : "בחר קודם מערכת"}
                          </option>

                          {(
                            interceptorOptions[
                              detail.simulatedSystemName
                            ] || []
                          ).map(
                            (
                              interceptor
                            ) => (
                              <option
                                key={
                                  interceptor
                                }
                                value={
                                  interceptor
                                }
                              >
                                {
                                  interceptor
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                    </div>

                    {/* =================================================
                        פרטי יירוט והגנה
                    ================================================= */}

                    <div
                      style={{
                        ...sectionTitleStyle,

                        marginTop:
                          "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            "13px",
                        }}
                      >
                        🛡
                      </span>

                      <span>
                        פרטי יירוט והגנה
                      </span>
                    </div>

                    {/* =================================================
                        מיקום במפה (ידני X, Y + בחירה במפה)
                    ================================================= */}

                    <div
                      style={{
                        ...fieldStyle,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <label
                          style={{
                            ...labelStyle,
                            marginBottom: 0,
                            color: "#1e293b",
                            fontWeight: 700,
                          }}
                        >
                          מיקום וגובה יירוט (X, Y, ASL, AGL)
                        </label>

                        {detail.location && (
                          <span
                            style={{
                              fontSize: "10.5px",
                              color: "#15803d",
                              background: "#dcfce7",
                              padding: "2px 6px",
                              borderRadius: "5px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            ✓ מוגדר במפה
                          </span>
                        )}
                      </div>

                      {/* Manual X and Y inputs */}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              ...labelStyle,
                              fontSize: "10.5px",
                              color: "#64748b",
                              marginBottom: "3px",
                            }}
                          >
                            X (קו אורך / Lng)
                          </label>

                          <input
                            type="number"
                            step="any"
                            value={
                              detail.manualLng ??
                              (detail.location
                                ? String(detail.location.lng)
                                : "")
                            }
                            onChange={(e) =>
                              handleManualCoordinateChange(
                                detail.id,
                                "lng",
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                applyManualCoordinates(detail.id);
                              }
                            }}
                            placeholder="לדוגמה 34.85"
                            className="defense-input"
                            style={{
                              ...inputStyle,
                              height: "32px",
                              fontSize: "12px",
                              direction: "ltr",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              ...labelStyle,
                              fontSize: "10.5px",
                              color: "#64748b",
                              marginBottom: "3px",
                            }}
                          >
                            Y (קו רוחב / Lat)
                          </label>

                          <input
                            type="number"
                            step="any"
                            value={
                              detail.manualLat ??
                              (detail.location
                                ? String(detail.location.lat)
                                : "")
                            }
                            onChange={(e) =>
                              handleManualCoordinateChange(
                                detail.id,
                                "lat",
                                e.target.value
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                applyManualCoordinates(detail.id);
                              }
                            }}
                            placeholder="לדוגמה 31.04"
                            className="defense-input"
                            style={{
                              ...inputStyle,
                              height: "32px",
                              fontSize: "12px",
                              direction: "ltr",
                            }}
                          />
                        </div>
                      </div>

                      {/* Manual ASL and AGL inputs */}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <label
                            style={{
                              ...labelStyle,
                              fontSize: "10.5px",
                              color: "#64748b",
                              marginBottom: "3px",
                            }}
                          >
                            גובה ASL (מעל פני הים / מטר)
                          </label>

                          <input
                            type="number"
                            step="any"
                            value={
                              detail.altitudeAsl || ""
                            }
                            onChange={(e) =>
                              updateDefenseDetails(
                                detail.id,
                                "altitudeAsl",
                                e.target.value
                              )
                            }
                            placeholder="לדוגמה: 450"
                            className="defense-input"
                            style={{
                              ...inputStyle,
                              height: "32px",
                              fontSize: "12px",
                              direction: "ltr",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              ...labelStyle,
                              fontSize: "10.5px",
                              color: "#64748b",
                              marginBottom: "3px",
                            }}
                          >
                            גובה AGL (מעל פני הקרקע / מטר)
                          </label>

                          <input
                            type="number"
                            step="any"
                            value={
                              detail.altitudeAgl || ""
                            }
                            onChange={(e) =>
                              updateDefenseDetails(
                                detail.id,
                                "altitudeAgl",
                                e.target.value
                              )
                            }
                            placeholder="לדוגמה: 120"
                            className="defense-input"
                            style={{
                              ...inputStyle,
                              height: "32px",
                              fontSize: "12px",
                              direction: "ltr",
                            }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}

                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          alignItems: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            applyManualCoordinates(
                              detail.id
                            )
                          }
                          style={{
                            flex: 1.2,
                            height: "32px",
                            border: "none",
                            borderRadius: "6px",
                            background:
                              "linear-gradient(135deg, #1765b5 0%, #1d7ed0 100%)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            boxShadow:
                              "0 2px 6px rgba(23, 101, 181, 0.2)",
                          }}
                          title="הצב את הקואורדינטות שהוזנו על גבי המפה"
                        >
                          <span>📍</span>

                          <span>
                            עדכן מיקום ידני
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            startPickingLocation(
                              detail.id
                            )
                          }
                          style={{
                            flex: 1,
                            height: "32px",
                            border:
                              pickingCardId ===
                              detail.id
                                ? "1.5px solid #1765b5"
                                : "1px solid #cbd5e1",
                            borderRadius: "6px",
                            background:
                              pickingCardId ===
                              detail.id
                                ? "#e0f2fe"
                                : "#fff",
                            color:
                              pickingCardId ===
                              detail.id
                                ? "#0369a1"
                                : "#334155",
                            cursor:
                              "pointer",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                          title="בחר מיקום על גבי המפה באמצעות לחיצה"
                        >
                          <span>🎯</span>

                          <span>
                            {pickingCardId ===
                            detail.id
                              ? "לחץ במפה..."
                              : "בחר במפה"}
                          </span>
                        </button>

                        {detail.location && (
                          <>
                            {map && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    detail.location &&
                                    map
                                  ) {
                                    map.setView(
                                      [
                                        detail.location.lat,
                                        detail.location.lng,
                                      ],
                                      Math.max(
                                        map.getZoom(),
                                        8
                                      ),
                                      {
                                        animate:
                                          true,
                                      }
                                    );

                                    const marker =
                                      markersRef.current.get(
                                        detail.id
                                      );

                                    if (marker)
                                      marker.openPopup();
                                  }
                                }}
                                style={{
                                  height: "32px",
                                  padding: "0 8px",
                                  border:
                                    "1px solid #bfdbfe",
                                  borderRadius:
                                    "6px",
                                  background:
                                    "#eff6ff",
                                  color:
                                    "#1d4ed8",
                                  cursor:
                                    "pointer",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    700,
                                }}
                                title="התמקד בנקודה במפה"
                              >
                                הצג
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                removeLocation(
                                  detail.id
                                )
                              }
                              style={{
                                height: "32px",
                                padding: "0 8px",
                                border:
                                  "1px solid #fecaca",
                                borderRadius:
                                  "6px",
                                background:
                                  "#fff5f5",
                                color:
                                  "#dc2626",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  700,
                              }}
                              title="הסר מיקום זה מהמפה"
                            >
                              הסר
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                )
              )}

            </div>

            {/* =================================================
                הוספת פרטי הגנה
            ================================================= */}

            <button
              type="button"
              onClick={
                handleAddDefenseDetails
              }
              style={{
                width:
                  "100%",

                height:
                  "42px",

                marginTop:
                  "12px",

                border:
                  "1px dashed #8ca9c8",

                background:
                  "#f8fbff",

                color:
                  "#14599f",

                cursor:
                  "pointer",

                fontSize:
                  "13px",

                fontWeight:
                  700,

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "7px",

                borderRadius:
                  "8px",
              }}
            >
              <span
                style={{
                  fontSize:
                    "18px",

                  lineHeight:
                    1,

                  fontWeight:
                    400,
                }}
              >
                +
              </span>

              הוסף פרטי ירוט
            </button>

          </div>

          {/* =================================================
              Footer
          ================================================= */}

          <div
            style={{
              flexShrink:
                0,

              padding:
                "12px 16px",

              background:
                "#fff",

              borderTop:
                "1px solid #dfe4eb",

              display:
                "flex",

              gap:
                "9px",
            }}
          >

            <button
              type="button"
              onClick={
                handleCancel
              }
              style={{
                flex:
                  1,

                height:
                  "40px",

                borderRadius:
                  "7px",

                border:
                  "1px solid #d6dce5",

                background:
                  "#fff",

                color:
                  "#4e5b6d",

                cursor:
                  "pointer",

                fontSize:
                  "13px",

                fontWeight:
                  600,
              }}
            >
              ביטול
            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              style={{
                flex:
                  1.5,

                height:
                  "40px",

                borderRadius:
                  "7px",

                border:
                  "none",

                background:
                  "linear-gradient(135deg, #1765b5, #1d7ed0)",

                color:
                  "#fff",

                cursor:
                  "pointer",

                fontSize:
                  "13px",

                fontWeight:
                  700,

                boxShadow:
                  "0 4px 10px rgba(23, 101, 181, 0.20)",
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