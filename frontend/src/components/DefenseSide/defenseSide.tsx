import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

/* =========================================================
   TYPES
========================================================= */

export type LauncherForm = {
  id: number;

  launchersGroupId: number | null;

  longitude: number | null;
  latitude: number | null;

  asl: string;
  agl: string;

  type: number | null;

  amount: number;
  active: boolean;
};

export type LaunchersGroupForm = {
  id?: number;
  name: string;
  description?: string;
  launchers: LauncherForm[];
};

export type LauncherTypeOption = {
  id: number;
  name: string;
};

/* =========================================================
   PROPS
========================================================= */

export interface DefenseSideProps {
  open: boolean;
  onClose: () => void;

  map?: L.Map | null;

  launchersGroup?: {
    id?: number;
    name: string;
    description?: string;
  };

  onSave?: (data: LaunchersGroupForm) => void;
}

/* =========================================================
   API
========================================================= */

const API_BASE_URL = "http://localhost:3000/api";

/* =========================================================
   HELPERS
========================================================= */

const createEmptyLauncher = (
  launchersGroupId: number | null = null
): LauncherForm => ({
  id: Date.now() + Math.random(),

  launchersGroupId,

  longitude: null,
  latitude: null,

  asl: "",
  agl: "",

  type: null,

  amount: 1,

  active: true,
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

/* =========================================================
   MAP ICON
========================================================= */

const createLauncherIcon = (
  groupNumber: number | string,
  launcherNumber: number
) => {
  return L.divIcon({
    className: "launcher-marker-icon",

    html: `
      <div style="
        position: relative;
        width: 52px;
        height: 52px;
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
          animation: launcherPulse 2s infinite ease-out;
        "></div>

        <div style="
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #102a56 0%,
            #1765b5 100%
          );
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
            width="20"
            height="20"
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

        <!-- מספר הקבוצה -->
        <div style="
          position: absolute;
          bottom: -1px;
          right: -2px;
          background: #1d72cf;
          color: #ffffff;
          border: 1.5px solid #ffffff;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 10px;
          font-weight: 800;
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.35);
        ">
          ${groupNumber}
        </div>

        <!-- מספר ה-Launcher -->
        <div style="
          position: absolute;
          top: -3px;
          left: -3px;
          background: #ffffff;
          color: #102a56;
          border: 1.5px solid #1765b5;
          border-radius: 50%;
          width: 17px;
          height: 17px;
          font-size: 9px;
          font-weight: 800;
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        ">
          ${launcherNumber}
        </div>

      </div>
    `,

    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -26],
  });
};

/* =========================================================
   COMPONENT
========================================================= */

export const DefenseSide: React.FC<DefenseSideProps> = ({
  open,
  onClose,
  map,
  launchersGroup,
  onSave,
}) => {
  const [groupName, setGroupName] = useState(
    launchersGroup?.name || ""
  );

  const [groupDescription, setGroupDescription] =
    useState(launchersGroup?.description || "");

  const [launchers, setLaunchers] = useState<LauncherForm[]>([
    createEmptyLauncher(launchersGroup?.id ?? null),
  ]);

  /*
   * ID של הקבוצה הנוכחית.
   *
   * לפני Save:
   * null
   *
   * אחרי יצירת הקבוצה:
   * ה-ID האמיתי שה-DB החזיר.
   *
   * במקרה של Save חלקי אנחנו משתמשים באותו ID
   * בניסיון הבא ולא יוצרים Group חדש.
   */
  const [currentGroupId, setCurrentGroupId] =
    useState<number | null>(
      launchersGroup?.id ?? null
    );

  /*
   * IDs פנימיים של ה-Launchers שכבר נשמרו בהצלחה.
   *
   * חשוב:
   * זה ה-ID הפנימי של הטופס ולא ה-ID של ה-DB.
   *
   * לדוגמה:
   *
   * Launcher 1 הצליח
   * Launcher 2 נכשל
   *
   * Retry:
   * Launcher 1 לא יישלח שוב.
   * Launcher 2 כן יישלח.
   */
  const [savedLauncherIds, setSavedLauncherIds] =
    useState<Set<number>>(new Set());

  const [pickingLauncherId, setPickingLauncherId] =
    useState<number | null>(null);

  const [locationInputs, setLocationInputs] = useState<
    Map<number, { lat: string; lng: string }>
  >(new Map());

  const [isSaving, setIsSaving] = useState(false);

  /*
   * הודעת הצלחה לאחר שמירה מלאה.
   */
  const [showSuccessMessage, setShowSuccessMessage] =
    useState(false);

  /*
   * כאן נשמור את כל הסמנים שנמצאים כרגע על המפה.
   *
   * הסמנים שייכים ל-DefenseSide בלבד.
   */
  const markersRef = useRef<Map<number, L.Marker>>(
    new Map()
  );

  /* =========================================================
     LAUNCHER TYPES
  ========================================================= */

  const [launcherTypes, setLauncherTypes] =
    useState<LauncherTypeOption[]>([]);

  useEffect(() => {
    const fetchLauncherTypes = async () => {
      try {
        console.log("Fetching launcher types...");

        const response = await fetch(
          `${API_BASE_URL}/launcher-types`
        );

        console.log(
          "Launcher types response status:",
          response.status
        );

        console.log(
          "Launcher types response URL:",
          response.url
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch launcher types: ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "Launcher types response:",
          result
        );

        if (Array.isArray(result)) {
          setLauncherTypes(result);
        } else if (Array.isArray(result?.data)) {
          setLauncherTypes(result.data);
        } else {
          console.error(
            "Launcher types response is not an array:",
            result
          );

          setLauncherTypes([]);
        }
      } catch (error) {
        console.error(
          "Error fetching launcher types:",
          error
        );

        setLauncherTypes([]);
      }
    };

    fetchLauncherTypes();
  }, []);

  /* =========================================================
     UPDATE LAUNCHER
  ========================================================= */

  const updateLauncher = <K extends keyof LauncherForm>(
    id: number,
    field: K,
    value: LauncherForm[K]
  ) => {
    setLaunchers((prev) =>
      prev.map((launcher) =>
        launcher.id === id
          ? {
            ...launcher,
            [field]: value,
          }
          : launcher
      )
    );
  };

  /* =========================================================
     ADD LAUNCHER
  ========================================================= */

  const addLauncher = () => {
    const newLauncher = createEmptyLauncher(
      currentGroupId
    );

    setLaunchers((prev) => [
      ...prev,
      newLauncher,
    ]);

    setLocationInputs((prev) => {
      const next = new Map(prev);

      next.set(newLauncher.id, {
        lat: "",
        lng: "",
      });

      return next;
    });
  };

  /* =========================================================
     REMOVE LAUNCHER
  ========================================================= */

  const removeLauncher = (id: number) => {
    if (pickingLauncherId === id) {
      setPickingLauncherId(null);
    }

    const marker = markersRef.current.get(id);

    if (marker) {
      marker.remove();
      markersRef.current.delete(id);
    }

    setLaunchers((prev) =>
      prev.length > 1
        ? prev.filter(
          (launcher) => launcher.id !== id
        )
        : prev
    );

    /*
     * אם Launcher שהיה שמור כבר הוסר מהטופס,
     * אין טעם לשמור את ה-ID שלו ברשימת ה-Saved
     * עבור הטופס הנוכחי.
     */
    setSavedLauncherIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    setLocationInputs((prev) => {
      const next = new Map(prev);

      next.delete(id);

      return next;
    });
  };

  /* =========================================================
     LOCATION INPUT
  ========================================================= */

  const handleLocationInputChange = (
    id: number,
    coordinate: "lat" | "lng",
    value: string
  ) => {
    setLocationInputs((prev) => {
      const next = new Map(prev);

      const current = next.get(id) || {
        lat: "",
        lng: "",
      };

      next.set(id, {
        ...current,
        [coordinate]: value,
      });

      return next;
    });
  };

  /* =========================================================
     APPLY MANUAL LOCATION
  ========================================================= */

  const applyManualLocation = (id: number) => {
    const input = locationInputs.get(id);

    if (!input) {
      return;
    }

    if (
      input.lat.trim() === "" ||
      input.lng.trim() === ""
    ) {
      alert("יש להזין LAT ו-LNG");
      return;
    }

    const lat = Number(input.lat);
    const lng = Number(input.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      alert("LAT או LNG אינם תקינים");
      return;
    }

    if (lat < -90 || lat > 90) {
      alert("LAT חייב להיות בין ‎-90 ל-90");
      return;
    }

    if (lng < -180 || lng > 180) {
      alert("LNG חייב להיות בין ‎-180 ל-180");
      return;
    }

    setLaunchers((prev) =>
      prev.map((launcher) =>
        launcher.id === id
          ? {
            ...launcher,
            latitude: lat,
            longitude: lng,
          }
          : launcher
      )
    );

    setLocationInputs((prev) => {
      const next = new Map(prev);

      next.set(id, {
        lat: String(lat),
        lng: String(lng),
      });

      return next;
    });
  };

  /* =========================================================
     REMOVE LOCATION
  ========================================================= */

  const removeLocation = (id: number) => {
    setLaunchers((prev) =>
      prev.map((launcher) =>
        launcher.id === id
          ? {
            ...launcher,
            latitude: null,
            longitude: null,
          }
          : launcher
      )
    );

    setLocationInputs((prev) => {
      const next = new Map(prev);

      next.set(id, {
        lat: "",
        lng: "",
      });

      return next;
    });

    if (pickingLauncherId === id) {
      setPickingLauncherId(null);
    }
  };

  /* =========================================================
     START MAP PICKING
  ========================================================= */

  const startPickingLocation = (id: number) => {
    setPickingLauncherId((prev) =>
      prev === id ? null : id
    );
  };

  /* =========================================================
     MAP CLICK
  ========================================================= */

  useEffect(() => {
    if (!map) {
      return;
    }

    if (pickingLauncherId === null) {
      map.getContainer().style.cursor = "";
      return;
    }

    map.getContainer().style.cursor = "crosshair";

    const handleMapClick = (
      e: L.LeafletMouseEvent
    ) => {
      const { lat, lng } = e.latlng;

      const launcherId = pickingLauncherId;

      setLaunchers((prev) =>
        prev.map((launcher) =>
          launcher.id === launcherId
            ? {
              ...launcher,
              latitude: lat,
              longitude: lng,
            }
            : launcher
        )
      );

      setLocationInputs((prev) => {
        const next = new Map(prev);

        next.set(launcherId, {
          lat: String(lat),
          lng: String(lng),
        });

        return next;
      });

      setPickingLauncherId(null);
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
      map.getContainer().style.cursor = "";
    };
  }, [map, pickingLauncherId]);

  /* =========================================================
     MAP MARKERS
  ========================================================= */

  useEffect(() => {
    if (!map) {
      return;
    }

    const currentMarkers = markersRef.current;

    /*
     * הסמנים מגיעים אך ורק מה-Launchers שנמצאים כרגע בטופס.
     *
     * אין כאן Polyline.
     */

    const validLaunchers = launchers.filter(
      (launcher) =>
        launcher.latitude !== null &&
        launcher.longitude !== null
    );

    const validIds = new Set(
      validLaunchers.map(
        (launcher) => launcher.id
      )
    );

    /*
     * מוחקים סמנים שכבר אינם בטופס
     * או שאין להם מיקום תקין.
     */
    currentMarkers.forEach((marker, id) => {
      if (!validIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    /*
     * מספרי Launcher בתוך הקבוצה הנוכחית.
     */
    validLaunchers.forEach(
      (launcher, index) => {
        if (
          launcher.latitude === null ||
          launcher.longitude === null
        ) {
          return;
        }

        /*
         * לפני Save אין עדיין Group ID.
         * לכן מציגים "חדשה".
         *
         * אחרי יצירת הקבוצה, ה-ID האמיתי נכנס ל-launcher.
         */
        const groupNumber =
          launcher.launchersGroupId !== null
            ? launcher.launchersGroupId
            : "חדשה";

        const launcherNumber = index + 1;

        const launcherTypeName =
          launcherTypes.find(
            (type) =>
              type.id === launcher.type
          )?.name ||
          (launcher.type !== null
            ? String(launcher.type)
            : "לא נבחר");

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
              🎯 קבוצה ${groupNumber}
              · Launcher ${launcherNumber}
            </div>

            <div
              style="
                font-size: 12px;
                color: #334155;
                margin-bottom: 5px;
              "
            >
              <strong>סוג:</strong>
              ${escapeHtml(launcherTypeName)}
            </div>

            <div
              style="
                font-size: 12px;
                color: #334155;
                margin-bottom: 5px;
              "
            >
              <strong>כמות:</strong>
              ${launcher.amount}
            </div>

            <div
              style="
                font-size: 12px;
                color: #334155;
                margin-bottom: 5px;
              "
            >
              <strong>ASL:</strong>
              ${escapeHtml(launcher.asl || "-")}
            </div>

            <div
              style="
                font-size: 12px;
                color: #334155;
                margin-bottom: 5px;
              "
            >
              <strong>AGL:</strong>
              ${escapeHtml(launcher.agl || "-")}
            </div>

            <div
              style="
                font-size: 11px;
                color: #64748b;
                margin-top: 8px;
                padding-top: 6px;
                border-top: 1px solid #e2e8f0;
                direction: ltr;
                text-align: left;
              "
            >
              LAT:
              ${launcher.latitude.toFixed(6)}
              <br />
              LNG:
              ${launcher.longitude.toFixed(6)}
            </div>

          </div>
        `;

        const icon = createLauncherIcon(
          groupNumber,
          launcherNumber
        );

        const existingMarker =
          currentMarkers.get(launcher.id);

        if (existingMarker) {
          existingMarker.setLatLng([
            launcher.latitude,
            launcher.longitude,
          ]);

          existingMarker.setIcon(icon);

          existingMarker.setPopupContent(
            popupContent
          );
        } else {
          const marker = L.marker(
            [
              launcher.latitude,
              launcher.longitude,
            ],
            {
              icon,
            }
          )
            .addTo(map)
            .bindPopup(popupContent);

          currentMarkers.set(
            launcher.id,
            marker
          );
        }
      }
    );
  }, [
    map,
    launchers,
    launcherTypes,
  ]);

  /* =========================================================
     REMOVE ALL MAP MARKERS
  ========================================================= */

  /*
   * הפונקציה הזאת נקראת רק כאשר:
   *
   * 1. Save הצליח במלואו
   * 2. המשתמש לחץ Cancel
   * 3. הקומפוננטה מתפרקת
   */
  const removeAllMapMarkers = () => {
    markersRef.current.forEach(
      (marker) => {
        marker.remove();
      }
    );

    markersRef.current.clear();
  };

  /* =========================================================
     CLEANUP MARKERS
  ========================================================= */

  useEffect(() => {
    return () => {
      markersRef.current.forEach(
        (marker) => marker.remove()
      );

      markersRef.current.clear();
    };
  }, []);

  /* =========================================================
     RESET FORM AFTER SUCCESSFUL SAVE
  ========================================================= */

  const resetFormAfterSuccessfulSave = () => {
    /*
     * מוחקים סמנים רק אחרי שכל ה-Save הצליח.
     */
    removeAllMapMarkers();

    setGroupName("");

    setGroupDescription("");

    setCurrentGroupId(null);

    setSavedLauncherIds(new Set());

    setLaunchers([
      createEmptyLauncher(null),
    ]);

    setLocationInputs(new Map());

    setPickingLauncherId(null);
  };

  /* =========================================================
     CANCEL
  ========================================================= */

  const handleCancel = () => {
    if (isSaving) {
      return;
    }

    /*
     * Cancel מנקה את העבודה המקומית.
     *
     * שים לב:
     * אם כבר נוצרו רשומות בשרת בגלל Save חלקי,
     * Cancel לא יכול לבצע Rollback לשרת ללא
     * DELETE/Transaction בצד השרת.
     */

    removeAllMapMarkers();

    setGroupName("");

    setGroupDescription("");

    setCurrentGroupId(null);

    setSavedLauncherIds(new Set());

    setLaunchers([
      createEmptyLauncher(null),
    ]);

    setLocationInputs(new Map());

    setPickingLauncherId(null);

    onClose();
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!groupName.trim()) {
      alert("יש להזין שם לקבוצת המשגרים");
      return;
    }

    if (launchers.length === 0) {
      alert("יש להוסיף לפחות Launcher אחד");
      return;
    }

    const launcherWithoutLocation =
      launchers.find(
        (launcher) =>
          launcher.latitude === null ||
          launcher.longitude === null
      );

    if (launcherWithoutLocation) {
      const index =
        launchers.findIndex(
          (launcher) =>
            launcher.id ===
            launcherWithoutLocation.id
        ) + 1;

      alert(
        `יש להגדיר מיקום עבור Launcher ${index}`
      );

      return;
    }

    const launcherWithoutType =
      launchers.find(
        (launcher) =>
          launcher.type === null
      );

    if (launcherWithoutType) {
      const index =
        launchers.findIndex(
          (launcher) =>
            launcher.id ===
            launcherWithoutType.id
        ) + 1;

      alert(
        `יש לבחור סוג עבור Launcher ${index}`
      );

      return;
    }

    const launcherWithoutAsl =
      launchers.find(
        (launcher) =>
          launcher.asl.trim() === ""
      );

    if (launcherWithoutAsl) {
      const index =
        launchers.findIndex(
          (launcher) =>
            launcher.id ===
            launcherWithoutAsl.id
        ) + 1;

      alert(
        `יש להזין ASL עבור Launcher ${index}`
      );

      return;
    }

    const launcherWithoutAgl =
      launchers.find(
        (launcher) =>
          launcher.agl.trim() === ""
      );

    if (launcherWithoutAgl) {
      const index =
        launchers.findIndex(
          (launcher) =>
            launcher.id ===
            launcherWithoutAgl.id
        ) + 1;

      alert(
        `יש להזין AGL עבור Launcher ${index}`
      );

      return;
    }

    const invalidAmount =
      launchers.find(
        (launcher) =>
          !Number.isFinite(
            launcher.amount
          ) ||
          launcher.amount <= 0
      );

    if (invalidAmount) {
      alert(
        "כמות ה-Launcher חייבת להיות גדולה מ-0"
      );

      return;
    }

    /* -------------------------------------------------------
       START SAVE
    ------------------------------------------------------- */

    setIsSaving(true);

    try {
      /* =====================================================
         STEP 1
         CREATE GROUP ONLY IF NEEDED
      ===================================================== */

      let groupId = currentGroupId;

      /*
       * אם כבר נוצר Group בניסיון Save קודם,
       * משתמשים בו ולא יוצרים Group נוסף.
       */
      if (groupId === null) {
        const groupPayload = {
          name: groupName.trim(),

          description:
            groupDescription.trim() || undefined,
        };

        console.log(
          "STEP 1 - POST /api/launchers-groups",
          groupPayload
        );

        const groupResponse = await fetch(
          `${API_BASE_URL}/launchers-groups`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(
              groupPayload
            ),
          }
        );

        console.log(
          "Launchers group POST status:",
          groupResponse.status
        );

        if (!groupResponse.ok) {
          let errorMessage =
            `שגיאה ביצירת קבוצת המשגרים: ${groupResponse.status}`;

          try {
            const errorResult =
              await groupResponse.json();

            console.error(
              "Launchers group POST error:",
              errorResult
            );

            if (errorResult?.message) {
              errorMessage =
                errorResult.message;
            }
          } catch {
            // תשובת שגיאה שאינה JSON
          }

          throw new Error(errorMessage);
        }

        const groupResult =
          await groupResponse.json();

        console.log(
          "Launchers group response:",
          groupResult
        );

        const createdGroup =
          groupResult?.data ??
          groupResult;

        const createdGroupId =
          Number(createdGroup?.id);

        if (
          !Number.isFinite(
            createdGroupId
          ) ||
          createdGroupId <= 0
        ) {
          throw new Error(
            "השרת לא החזיר ID תקין לקבוצת המשגרים"
          );
        }

        console.log(
          "Created group ID:",
          createdGroupId
        );

        groupId = createdGroupId;

        /*
         * שומרים מיד את ה-ID.
         *
         * אם Launcher בהמשך ייכשל,
         * Retry ישתמש באותו Group.
         */
        setCurrentGroupId(
          createdGroupId
        );
      } else {
        console.log(
          "STEP 1 - Reusing existing group ID:",
          groupId
        );
      }

      /* =====================================================
         STEP 2
         CREATE ONLY UNSAVED LAUNCHERS
      ===================================================== */

      /*
       * Snapshot מקומי.
       *
       * אנחנו מעדכנים אותו מיד אחרי הצלחה,
       * כדי שגם בתוך אותו ניסיון Save
       * המצב יהיה עקבי.
       */
      const savedIdsThisAttempt =
        new Set(savedLauncherIds);

      /*
       * נשמור כאן את כל ה-Launchers שהיו חלק
       * מהקבוצה מבחינת ה-UI.
       */
      const finalLaunchers: LauncherForm[] = [];

      for (
        let index = 0;
        index < launchers.length;
        index++
      ) {
        const launcher =
          launchers[index];

        /* ---------------------------------------------------
           ALREADY SAVED
        --------------------------------------------------- */

        if (
          savedIdsThisAttempt.has(
            launcher.id
          )
        ) {
          console.log(
            `Launcher ${index + 1} already saved - skipping`
          );

          finalLaunchers.push({
            ...launcher,
            launchersGroupId:
              groupId,
          });

          continue;
        }

        /* ---------------------------------------------------
           SAVE LAUNCHER
        --------------------------------------------------- */

        const launcherPayload = {
          launchersGroupId:
            groupId,

          longitude:
            launcher.longitude,

          latitude:
            launcher.latitude,

          asl:
            Number(launcher.asl),

          agl:
            Number(launcher.agl),

          type:
            launcher.type,

          amount:
            launcher.amount,

          active:
            launcher.active,
        };

        console.log(
          `STEP 2.${index + 1} - POST /api/launchers`,
          launcherPayload
        );

        const launcherResponse =
          await fetch(
            `${API_BASE_URL}/launchers`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                launcherPayload
              ),
            }
          );

        console.log(
          `Launcher ${index + 1} POST status:`,
          launcherResponse.status
        );

        if (!launcherResponse.ok) {
          let errorMessage =
            `שגיאה בשמירת Launcher ${index + 1}: ${launcherResponse.status}`;

          try {
            const errorResult =
              await launcherResponse.json();

            console.error(
              `Launcher ${index + 1} POST error:`,
              errorResult
            );

            if (
              errorResult?.message
            ) {
              errorMessage =
                errorResult.message;
            }
          } catch {
            // תשובת שגיאה שאינה JSON
          }

          /*
           * כאן אנחנו עוצרים.
           *
           * לא מוחקים:
           * - markers
           * - launchers
           * - groupId
           * - savedLauncherIds
           *
           * כך Retry יכול להמשיך בדיוק מהמקום
           * שבו השמירה נכשלה.
           */
          throw new Error(
            errorMessage
          );
        }

        const launcherResult =
          await launcherResponse.json();

        console.log(
          `Launcher ${index + 1} response:`,
          launcherResult
        );

        const createdLauncher =
          launcherResult?.data ??
          launcherResult;

        const realLauncherId =
          Number(
            createdLauncher?.id
          );

        if (
          !Number.isFinite(
            realLauncherId
          ) ||
          realLauncherId <= 0
        ) {
          throw new Error(
            `השרת לא החזיר ID תקין עבור Launcher ${index + 1}`
          );
        }

        /*
         * רק עכשיו, אחרי שהשרת אישר הצלחה,
         * אנחנו מסמנים את ה-Launcher כ-Saved.
         */
        savedIdsThisAttempt.add(
          launcher.id
        );

        setSavedLauncherIds(
          new Set(savedIdsThisAttempt)
        );

        /*
         * מעדכנים את ה-Group ID של ה-Launcher
         * בטופס.
         *
         * ה-ID הפנימי של ה-UI נשאר אותו ID,
         * כדי שה-marker יישאר מקושר אליו.
         */
        setLaunchers((prev) =>
          prev.map((item) =>
            item.id === launcher.id
              ? {
                ...item,
                launchersGroupId:
                  groupId,
              }
              : item
          )
        );

        finalLaunchers.push({
          id: realLauncherId,

          launchersGroupId:
            groupId,

          longitude:
            launcher.longitude,

          latitude:
            launcher.latitude,

          asl:
            launcher.asl,

          agl:
            launcher.agl,

          type:
            launcher.type,

          amount:
            launcher.amount,

          active:
            launcher.active,
        });
      }

      /* =====================================================
         STEP 3
         EVERYTHING SAVED SUCCESSFULLY
      ===================================================== */

      const data: LaunchersGroupForm = {
        id: groupId,

        name:
          groupName.trim(),

        description:
          groupDescription.trim() ||
          undefined,

        launchers:
          finalLaunchers,
      };

      console.log(
        "All launchers saved successfully:",
        data
      );

      /*
       * onSave הוא callback של ה-parent.
       *
       * אם ה-API הצליח אבל callback פנימי
       * זורק exception, אנחנו עדיין לא רוצים
       * להציג למשתמש כאילו השמירה לשרת נכשלה.
       */
      try {
        if (onSave) {
          onSave(data);
        }
      } catch (callbackError) {
        console.error(
          "onSave callback error:",
          callbackError
        );
      }

      /* =====================================================
         STEP 4
         REMOVE MARKERS
      ===================================================== */

      console.log(
        "Removing launcher markers from map after successful save..."
      );

      resetFormAfterSuccessfulSave();

      /*
       * הודעת הצלחה - מוצגת רק אחרי שכל השמירה הצליחה.
       */
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      /* =====================================================
         STEP 5
         CLOSE PANEL
      ===================================================== */

      onClose();

    } catch (error) {
      /*
       * במקרה של שגיאה:
       *
       * לא:
       * - reset
       * - remove markers
       * - onClose
       *
       * הנתונים והסמנים נשארים כדי שהמשתמש
       * יוכל לתקן ולנסות שוב.
       */

      console.error(
        "Error saving launchers group:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "אירעה שגיאה בשמירת קבוצת המשגרים"
      );

    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

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

        .defense-side-close-btn:hover {
          background: rgba(255, 255, 255, 0.22) !important;
        }

        .launcher-marker-icon {
          background: transparent !important;
          border: none !important;
        }

        @keyframes launcherPulse {
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
          0%,
          100% {
            box-shadow:
              0 10px 30px rgba(16, 42, 86, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.2);
          }

          50% {
            box-shadow:
              0 10px 35px rgba(23, 101, 181, 0.65),
              0 0 0 2px rgba(56, 189, 248, 0.6);
          }
        }

      `}</style>

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {showSuccessMessage && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20000,
            background:
              "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
            color: "#fff",
            padding: "13px 24px",
            borderRadius: "10px",
            boxShadow:
              "0 8px 24px rgba(22, 101, 52, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontFamily:
              "Arial, Helvetica, sans-serif",
            fontSize: "14px",
            fontWeight: 700,
            minWidth: "260px",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
            }}
          >
            ✓
          </span>

          <span>
            קבוצת המשגרים נשמרה בהצלחה
          </span>
        </div>
      )}

      {/* =====================================================
          MAP PICKING BANNER
      ===================================================== */}

      {pickingLauncherId !== null && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 12000,
            background:
              "linear-gradient(135deg, #102a56 0%, #175ca8 100%)",
            color: "#fff",
            padding: "11px 22px",
            borderRadius: "12px",
            boxShadow:
              "0 10px 30px rgba(16, 42, 86, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "14px",
            fontWeight: 600,
            fontFamily:
              "Arial, Helvetica, sans-serif",
            animation:
              "defenseBannerPulse 2s infinite ease-in-out",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background:
                "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🎯
          </div>

          <span>
            לחץ על המפה לבחירת מיקום עבור Launcher{" "}
            {launchers.findIndex(
              (launcher) =>
                launcher.id ===
                pickingLauncherId
            ) + 1}
          </span>

          <button
            type="button"
            onClick={() =>
              setPickingLauncherId(null)
            }
            style={{
              background:
                "rgba(255, 255, 255, 0.18)",
              border:
                "1px solid rgba(255, 255, 255, 0.3)",
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

      {/* =====================================================
          SIDE PANEL
      ===================================================== */}

      {open && (
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
            background: "#f5f7fa",
            borderRadius: "16px",
            boxShadow:
              "0 18px 50px rgba(15, 30, 55, 0.22)",
            border:
              "1px solid #dce2ea",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily:
              "Arial, Helvetica, sans-serif",
            color: "#172033",
            zIndex: 11000,
            animation:
              "defenseSideSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* =================================================
              HEADER
          ================================================= */}

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
                justifyContent:
                  "space-between",
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
                    background:
                      "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "21px",
                    border:
                      "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  🛡
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                    }}
                  >
                    יצירת קבוצת משגרים
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#cbd9ed",
                    }}
                  >
                    הגדרת Launcher-ים ומיקומם
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="defense-side-close-btn"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border:
                    "1px solid rgba(255, 255, 255, 0.2)",
                  background:
                    "rgba(255, 255, 255, 0.12)",
                  color: "#fff",
                  cursor: isSaving
                    ? "not-allowed"
                    : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
            }}
          >
            {/* ===============================================
                GROUP DETAILS
            =============================================== */}

            <div
              style={{
                background: "#fff",
                border:
                  "1px solid #dce3ec",
                borderRadius: "12px",
                padding: "18px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#16243a",
                  marginBottom: "15px",
                }}
              >
                פרטי הקבוצה
              </div>

              <div
                style={{
                  marginBottom: "14px",
                }}
              >
                <label style={labelStyle}>
                  שם קבוצת המשגרים
                </label>

                <input
                  type="text"
                  value={groupName}
                  disabled={isSaving}
                  onChange={(e) =>
                    setGroupName(
                      e.target.value
                    )
                  }
                  placeholder="לדוגמה: קבוצת הגנה דרום"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  תיאור
                </label>

                <textarea
                  value={groupDescription}
                  disabled={isSaving}
                  onChange={(e) =>
                    setGroupDescription(
                      e.target.value
                    )
                  }
                  placeholder="תיאור הקבוצה..."
                  style={{
                    ...inputStyle,
                    height: "80px",
                    padding:
                      "10px 13px",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {/* ===============================================
                LAUNCHERS HEADER
            =============================================== */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
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
                  Launcher-ים
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "12px",
                    color: "#748096",
                  }}
                >
                  לכל Launcher ניתן להגדיר מיקום נפרד
                </div>
              </div>

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
                {launchers.length}
              </div>
            </div>

            {/* ===============================================
                LAUNCHER CARDS
            =============================================== */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {launchers.map(
                (launcher, index) => {
                  const locationInput =
                    locationInputs.get(
                      launcher.id
                    ) || {
                      lat:
                        launcher.latitude !==
                          null
                          ? String(
                            launcher.latitude
                          )
                          : "",

                      lng:
                        launcher.longitude !==
                          null
                          ? String(
                            launcher.longitude
                          )
                          : "",
                    };

                  return (
                    <div
                      key={launcher.id}
                      style={{
                        position: "relative",
                        background: "#fff",
                        border:
                          "1px solid #dce3ec",
                        borderRadius: "12px",
                        padding: "18px",
                        boxShadow:
                          "0 4px 14px rgba(20, 40, 70, 0.06)",
                        overflow: "hidden",
                      }}
                    >
                      {/* SIDE LINE */}

                      <div
                        style={{
                          position:
                            "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: "4px",
                          background:
                            "linear-gradient(180deg, #1769c2, #1c8be0)",
                        }}
                      />

                      {/* CARD HEADER */}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "18px",
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
                              background:
                                "#edf4fc",
                              color:
                                "#1762ad",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              fontSize: "13px",
                              fontWeight: 700,
                            }}
                          >
                            {index + 1}
                          </div>

                          <div
                            style={{
                              fontSize:
                                "15px",
                              fontWeight: 700,
                              color:
                                "#1b2a40",
                            }}
                          >
                            Launcher{" "}
                            {index + 1}
                          </div>
                        </div>

                        {launchers.length >
                          1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeLauncher(
                                  launcher.id
                                )
                              }
                              disabled={
                                isSaving
                              }
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius:
                                  "7px",
                                border:
                                  "1px solid #e1e5eb",
                                background:
                                  "#fff",
                                color:
                                  "#8792a3",
                                cursor:
                                  isSaving
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize:
                                  "18px",
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          )}
                      </div>

                      {/* TYPE + AMOUNT */}

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginBottom:
                            "15px",
                        }}
                      >
                        <div
                          style={{
                            flex: 2,
                          }}
                        >
                          <label
                            style={
                              labelStyle
                            }
                          >
                            סוג Launcher
                          </label>

                          <select
                            value={
                              launcher.type ??
                              ""
                            }
                            disabled={
                              isSaving
                            }
                            onChange={(e) =>
                              updateLauncher(
                                launcher.id,
                                "type",
                                e.target.value
                                  ? Number(
                                    e.target.value
                                  )
                                  : null
                              )
                            }
                            style={
                              selectStyle
                            }
                          >
                            <option value="">
                              בחר סוג...
                            </option>

                            {launcherTypes.map(
                              (type) => (
                                <option
                                  key={
                                    type.id
                                  }
                                  value={
                                    type.id
                                  }
                                >
                                  {type.name}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <label
                            style={
                              labelStyle
                            }
                          >
                            כמות
                          </label>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              launcher.amount
                            }
                            disabled={
                              isSaving
                            }
                            onChange={(e) =>
                              updateLauncher(
                                launcher.id,
                                "amount",
                                Math.max(
                                  1,
                                  Number(
                                    e.target
                                      .value
                                  ) || 1
                                )
                              )
                            }
                            style={{
                              ...inputStyle,
                              direction:
                                "ltr",
                              textAlign:
                                "center",
                            }}
                          />
                        </div>
                      </div>

                      {/* ASL + AGL */}

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginBottom:
                            "15px",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <label
                            style={
                              labelStyle
                            }
                          >
                            ASL
                          </label>

                          <input
                            type="number"
                            step="any"
                            value={
                              launcher.asl
                            }
                            disabled={
                              isSaving
                            }
                            onChange={(e) =>
                              updateLauncher(
                                launcher.id,
                                "asl",
                                e.target
                                  .value
                              )
                            }
                            placeholder="גובה ASL"
                            style={{
                              ...inputStyle,
                              direction:
                                "ltr",
                              textAlign:
                                "left",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <label
                            style={
                              labelStyle
                            }
                          >
                            AGL
                          </label>

                          <input
                            type="number"
                            step="any"
                            value={
                              launcher.agl
                            }
                            disabled={
                              isSaving
                            }
                            onChange={(e) =>
                              updateLauncher(
                                launcher.id,
                                "agl",
                                e.target
                                  .value
                              )
                            }
                            placeholder="גובה AGL"
                            style={{
                              ...inputStyle,
                              direction:
                                "ltr",
                              textAlign:
                                "left",
                            }}
                          />
                        </div>
                      </div>

                      {/* LOCATION */}

                      <div
                        style={{
                          marginTop:
                            "16px",
                          paddingTop:
                            "14px",
                          borderTop:
                            "1px dashed #dbe2ec",
                        }}
                      >
                        <label
                          style={
                            labelStyle
                          }
                        >
                          מיקום Launcher
                        </label>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "10px",
                            marginBottom:
                              "10px",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                            }}
                          >
                            <label
                              style={{
                                ...labelStyle,
                                fontSize:
                                  "12px",
                              }}
                            >
                              LAT
                            </label>

                            <input
                              type="number"
                              step="any"
                              min="-90"
                              max="90"
                              value={
                                locationInput.lat
                              }
                              disabled={
                                isSaving
                              }
                              onChange={(
                                e
                              ) =>
                                handleLocationInputChange(
                                  launcher.id,
                                  "lat",
                                  e.target
                                    .value
                                )
                              }
                              placeholder="Latitude"
                              style={{
                                ...inputStyle,
                                direction:
                                  "ltr",
                                textAlign:
                                  "left",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              flex: 1,
                            }}
                          >
                            <label
                              style={{
                                ...labelStyle,
                                fontSize:
                                  "12px",
                              }}
                            >
                              LNG
                            </label>

                            <input
                              type="number"
                              step="any"
                              min="-180"
                              max="180"
                              value={
                                locationInput.lng
                              }
                              disabled={
                                isSaving
                              }
                              onChange={(
                                e
                              ) =>
                                handleLocationInputChange(
                                  launcher.id,
                                  "lng",
                                  e.target
                                    .value
                                )
                              }
                              placeholder="Longitude"
                              style={{
                                ...inputStyle,
                                direction:
                                  "ltr",
                                textAlign:
                                  "left",
                              }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            isSaving
                          }
                          onClick={() =>
                            applyManualLocation(
                              launcher.id
                            )
                          }
                          style={{
                            width: "100%",
                            height: "36px",
                            borderRadius:
                              "7px",
                            border:
                              "1px solid #b9d5f3",
                            background:
                              "#f0f7ff",
                            color:
                              "#1762ad",
                            cursor:
                              isSaving
                                ? "not-allowed"
                                : "pointer",
                            fontSize:
                              "13px",
                            fontWeight: 700,
                            marginBottom:
                              "10px",
                          }}
                        >
                          עדכן מיקום לפי LAT / LNG
                        </button>

                        {launcher.latitude !==
                          null &&
                          launcher.longitude !==
                          null ? (
                          <div
                            style={{
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              gap: "8px",
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
                                padding:
                                  "10px 12px",
                                borderRadius:
                                  "8px",
                                background:
                                  "#f0f7ff",
                                border:
                                  "1px solid #c8dff7",
                                fontSize:
                                  "13px",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexDirection:
                                    "column",
                                  gap: "3px",
                                  color:
                                    "#134e8d",
                                  fontWeight:
                                    600,
                                }}
                              >
                                <span>
                                  🎯 מיקום נוכחי
                                </span>

                                <span
                                  style={{
                                    direction:
                                      "ltr",
                                    textAlign:
                                      "left",
                                    fontSize:
                                      "12px",
                                  }}
                                >
                                  LAT:{" "}
                                  {launcher.latitude.toFixed(
                                    6
                                  )}

                                  {"  "}

                                  LNG:{" "}
                                  {launcher.longitude.toFixed(
                                    6
                                  )}
                                </span>
                              </div>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: "6px",
                                }}
                              >
                                {map && (
                                  <button
                                    type="button"
                                    disabled={
                                      isSaving
                                    }
                                    onClick={() => {
                                      map.setView(
                                        [
                                          launcher.latitude!,
                                          launcher.longitude!,
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
                                          launcher.id
                                        );

                                      if (
                                        marker
                                      ) {
                                        marker.openPopup();
                                      }
                                    }}
                                    style={{
                                      background:
                                        "#fff",
                                      border:
                                        "1px solid #b9d5f3",
                                      borderRadius:
                                        "6px",
                                      padding:
                                        "4px 8px",
                                      fontSize:
                                        "12px",
                                      color:
                                        "#1762ad",
                                      cursor:
                                        isSaving
                                          ? "not-allowed"
                                          : "pointer",
                                      fontWeight:
                                        600,
                                    }}
                                  >
                                    הצג
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={
                                    isSaving
                                  }
                                  onClick={() =>
                                    removeLocation(
                                      launcher.id
                                    )
                                  }
                                  style={{
                                    background:
                                      "#fff",
                                    border:
                                      "1px solid #fecaca",
                                    borderRadius:
                                      "6px",
                                    padding:
                                      "4px 8px",
                                    fontSize:
                                      "12px",
                                    color:
                                      "#dc2626",
                                    cursor:
                                      isSaving
                                        ? "not-allowed"
                                        : "pointer",
                                    fontWeight:
                                      600,
                                  }}
                                >
                                  הסר
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={
                                isSaving
                              }
                              onClick={() =>
                                startPickingLocation(
                                  launcher.id
                                )
                              }
                              style={{
                                width: "100%",
                                height: "36px",
                                borderRadius:
                                  "7px",
                                border:
                                  pickingLauncherId ===
                                    launcher.id
                                    ? "1.5px solid #1765b5"
                                    : "1px solid #d5dce7",
                                background:
                                  pickingLauncherId ===
                                    launcher.id
                                    ? "#e8f2fe"
                                    : "#fff",
                                color:
                                  pickingLauncherId ===
                                    launcher.id
                                    ? "#1765b5"
                                    : "#4a5568",
                                cursor:
                                  isSaving
                                    ? "not-allowed"
                                    : "pointer",
                                fontSize:
                                  "13px",
                                fontWeight:
                                  600,
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                gap: "6px",
                              }}
                            >
                              <span>
                                🎯
                              </span>

                              <span>
                                {pickingLauncherId ===
                                  launcher.id
                                  ? "לחץ על המפה לשינוי מיקום"
                                  : "שנה מיקום במפה"}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              isSaving
                            }
                            onClick={() =>
                              startPickingLocation(
                                launcher.id
                              )
                            }
                            style={{
                              width: "100%",
                              height: "40px",
                              borderRadius:
                                "8px",
                              border:
                                pickingLauncherId ===
                                  launcher.id
                                  ? "2px solid #1765b5"
                                  : "1px solid #b8d2ee",
                              background:
                                pickingLauncherId ===
                                  launcher.id
                                  ? "#eaf3fd"
                                  : "linear-gradient(180deg, #f7faff 0%, #edf5fd 100%)",
                              color:
                                pickingLauncherId ===
                                  launcher.id
                                  ? "#0f4c8a"
                                  : "#175ca8",
                              cursor:
                                isSaving
                                  ? "not-allowed"
                                  : "pointer",
                              fontSize:
                                "13px",
                              fontWeight: 700,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              gap: "7px",
                            }}
                          >
                            <span
                              style={{
                                fontSize:
                                  "16px",
                              }}
                            >
                              🎯
                            </span>

                            <span>
                              {pickingLauncherId ===
                                launcher.id
                                ? "לחץ על המפה להוספת מיקום"
                                : "הוסף מיקום במפה"}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* ACTIVE */}

                      <div
                        style={{
                          marginTop:
                            "14px",
                          paddingTop:
                            "12px",
                          borderTop:
                            "1px dashed #dbe2ec",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              "13px",
                            fontWeight:
                              600,
                            color:
                              "#263449",
                          }}
                        >
                          Launcher פעיל
                        </span>

                        <button
                          type="button"
                          disabled={
                            isSaving
                          }
                          onClick={() =>
                            updateLauncher(
                              launcher.id,
                              "active",
                              !launcher.active
                            )
                          }
                          style={{
                            width: "48px",
                            height: "26px",
                            borderRadius:
                              "20px",
                            border: "none",
                            background:
                              launcher.active
                                ? "#1765b5"
                                : "#cbd5e1",
                            cursor:
                              isSaving
                                ? "not-allowed"
                                : "pointer",
                            position:
                              "relative",
                            transition:
                              "background 0.2s ease",
                          }}
                        >
                          <span
                            style={{
                              position:
                                "absolute",
                              top: "3px",
                              right:
                                launcher.active
                                  ? "25px"
                                  : "3px",
                              width: "20px",
                              height: "20px",
                              borderRadius:
                                "50%",
                              background:
                                "#fff",
                              transition:
                                "right 0.2s ease",
                              boxShadow:
                                "0 1px 4px rgba(0,0,0,0.25)",
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* ===============================================
                ADD LAUNCHER
            =============================================== */}

            <button
              type="button"
              onClick={addLauncher}
              disabled={isSaving}
              style={{
                width: "100%",
                height: "46px",
                marginTop: "16px",
                borderRadius: "9px",
                border:
                  "1px dashed #8ca9c8",
                background:
                  "#f8fbff",
                color: "#14599f",
                cursor:
                  isSaving
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
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

              הוסף Launcher
            </button>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            style={{
              flexShrink: 0,
              padding: "15px 20px",
              background: "#fff",
              borderTop:
                "1px solid #dfe4eb",
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancel}
              style={{
                flex: 1,
                height: "44px",
                borderRadius: "8px",
                border:
                  "1px solid #d6dce5",
                background: "#fff",
                color: "#4e5b6d",
                cursor:
                  isSaving
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ביטול
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 1.5,
                height: "44px",
                borderRadius: "8px",
                border: "none",
                background:
                  isSaving
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #1765b5, #1d7ed0)",
                color: "#fff",
                cursor:
                  isSaving
                    ? "not-allowed"
                    : "pointer",
                fontSize: "14px",
                fontWeight: 700,
                boxShadow:
                  "0 5px 12px rgba(23, 101, 181, 0.22)",
              }}
            >
              {isSaving
                ? "שומר..."
                : "שמור קבוצת משגרים"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};