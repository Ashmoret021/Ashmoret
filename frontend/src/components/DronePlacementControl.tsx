import React from "react";

export interface Wave {
  id: string | number;
  requiredForWave?: number;
  placedForWave?: number;
  placementMode?: "single" | "batch";
  batchSize?: number;
}

export interface DronePlacementProps {
  wave: Wave;
  requiredForWave: number;
  placedForWave: number;
  remainingForWave: number;
  isComplete: boolean;
  labelStyle?: React.CSSProperties;
  updateWave: (id: string | number, field: string, value: string | number | boolean) => void;
  onStartPlacement: (
    waveId: string | number,
    options: { mode: "single" | "batch"; count: number }
  ) => void;
  onClose: () => void;
}

export const DronePlacementControl: React.FC<DronePlacementProps> = ({
  wave,
  requiredForWave,
  placedForWave,
  remainingForWave,
  isComplete,
  labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: "#334155",
    marginBottom: 6,
    display: "block",
  },
  updateWave,
  onStartPlacement,
  onClose,
}) => {
  const currentBatchSize =
    wave.batchSize !== undefined
      ? Math.min(wave.batchSize, remainingForWave)
      : remainingForWave;

  return (
    <div style={{ marginTop: 6 }}>
      <label style={labelStyle}>מיקום רחפנים על המפה</label>

      {/* Wave Placement Status Box */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 8,
          padding: "9px 12px",
          marginBottom: 10,
          border: "1px solid #e2e8f0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          textAlign: "center",
          fontSize: 11,
        }}
      >
        <div>
          <span style={{ color: "#64748b", display: "block" }}>דרושים</span>
          <span style={{ fontWeight: 800, color: "#1e293b", fontSize: 13.5 }}>
            {requiredForWave}
          </span>
        </div>
        <div>
          <span style={{ color: "#64748b", display: "block" }}>הוצבו</span>
          <span style={{ fontWeight: 800, color: "#873535", fontSize: 13.5 }}>
            {placedForWave}
          </span>
        </div>
        <div>
          <span style={{ color: "#64748b", display: "block" }}>נותרו</span>
          <span
            style={{
              fontWeight: 800,
              color: isComplete ? "#10b981" : "#0284c7",
              fontSize: 13.5,
            }}
          >
            {remainingForWave}
          </span>
        </div>
      </div>

      {/* Quantity & Mode Options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 10,
          background: "#f1f5f9",
          padding: 10,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#475569",
            fontWeight: 600,
          }}
        >
          <span>אופן הצבה:</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => updateWave(wave.id, "placementMode", "single")}
              style={{
                padding: "3px 8px",
                fontSize: 11,
                borderRadius: 4,
                border:
                  (wave.placementMode || "single") === "single"
                    ? "1px solid #a34343"
                    : "1px solid #cbd5e1",
                background:
                  (wave.placementMode || "single") === "single"
                    ? "#fff0f0"
                    : "#ffffff",
                color:
                  (wave.placementMode || "single") === "single"
                    ? "#a34343"
                    : "#64748b",
                cursor: "pointer",
                fontWeight:
                  (wave.placementMode || "single") === "single" ? 700 : 500,
              }}
            >
              בודד
            </button>
            <button
              type="button"
              onClick={() => updateWave(wave.id, "placementMode", "batch")}
              style={{
                padding: "3px 8px",
                fontSize: 11,
                borderRadius: 4,
                border:
                  wave.placementMode === "batch"
                    ? "1px solid #a34343"
                    : "1px solid #cbd5e1",
                background:
                  wave.placementMode === "batch" ? "#fff0f0" : "#ffffff",
                color: wave.placementMode === "batch" ? "#a34343" : "#64748b",
                cursor: "pointer",
                fontWeight: wave.placementMode === "batch" ? 700 : 500,
              }}
            >
              מקבץ בנקודה
            </button>
          </div>
        </div>

        {wave.placementMode === "batch" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <label style={{ fontSize: 11.5, color: "#334155", flexShrink: 0 }}>
              כמות להצבה בלחיצה:
            </label>
            <input
              type="number"
              min={1}
              max={remainingForWave}
              value={currentBatchSize}
              onChange={(e) => {
                const val = Math.max(
                  1,
                  Math.min(remainingForWave, Number(e.target.value) || 1)
                );
                updateWave(wave.id, "batchSize", val);
              }}
              style={{
                width: 60,
                padding: "4px 6px",
                fontSize: 12,
                borderRadius: 5,
                border: "1px solid #cbd5e1",
                textAlign: "center",
              }}
            />
            <span style={{ fontSize: 10.5, color: "#64748b" }}>
              (מתוך {remainingForWave} נותרים)
            </span>
            <button
              type="button"
              onClick={() => updateWave(wave.id, "batchSize", remainingForWave)}
              style={{
                padding: "3px 7px",
                fontSize: 10.5,
                borderRadius: 4,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#873535",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              כל הגל ({remainingForWave})
            </button>
          </div>
        )}
      </div>

      {/* "Place Drones" Button */}
      <button
        type="button"
        disabled={isComplete}
        onClick={() => {
          onStartPlacement(wave.id, {
            mode: wave.placementMode || "single",
            count: wave.placementMode === "batch" ? currentBatchSize : 1,
          });
          onClose();
        }}
        style={{
          width: "100%",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 8,
          border: isComplete ? "1px solid #cbd5e1" : "none",
          background: isComplete
            ? "#f1f5f9"
            : "linear-gradient(135deg, #873535 0%, #ad4242 100%)",
          color: isComplete ? "#94a3b8" : "#ffffff",
          cursor: isComplete ? "not-allowed" : "pointer",
          fontSize: 12.5,
          fontWeight: 700,
          boxShadow: isComplete ? "none" : "0 4px 12px rgba(135, 53, 53, 0.25)",
          transition: "all 0.2s ease",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 21C16 17 19 13.8 19 9.5C19 5.9 16.3 3 12 3C7.7 3 5 5.9 5 9.5C5 13.8 8 17 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        <span>
          {isComplete
            ? `✓ כל ${requiredForWave} הרחפנים הוצבו במפה`
            : wave.placementMode === "batch"
            ? `מקם מקבץ של ${currentBatchSize} במפה (בלחיצה אחת)`
            : `מקם רחפנים במפה (נותרו ${remainingForWave})`}
        </span>
      </button>
    </div>
  );
};

export default DronePlacementControl;
