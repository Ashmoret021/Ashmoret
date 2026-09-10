import React from "react";
import { DroneWave } from "../types/drone";

interface PlacementHUDProps {
  activeWave: DroneWave;
  placedCount: number;
  remainingCount: number;
  totalRequired: number;
  onFinish: () => void;
  onOpenForm: () => void;
}

export const PlacementHUD: React.FC<PlacementHUDProps> = ({
  activeWave,
  placedCount,
  remainingCount,
  totalRequired,
  onFinish,
  onOpenForm,
}) => {
  const isCompleted = remainingCount === 0;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1350,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        padding: "10px 20px",
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
        border: "2px solid #873535",
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
        maxWidth: "92vw",
      }}
    >
      {/* Pulsing indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: isCompleted ? "#10b981" : "#ef4444",
            boxShadow: isCompleted
              ? "0 0 10px #10b981"
              : "0 0 10px #ef4444",
            animation: "radar-pulse 1.5s infinite",
          }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
            הצבת רחפנים: גל {activeWave.id}
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {activeWave.droneType}
          </div>
        </div>
      </div>

      <div
        style={{
          height: 28,
          width: 1,
          background: "#e2e8f0",
        }}
      />

      {/* Counter */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 8,
            background: isCompleted ? "#dcfce7" : "#fee2e2",
            color: isCompleted ? "#15803d" : "#b91c1c",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {isCompleted
            ? "הושלם! הוצבו כל " + totalRequired + " הרחפנים"
            : `הוצבו: ${placedCount} / ${totalRequired} | נותרו: ${remainingCount}`}
        </div>

        {!isCompleted && (
          <span style={{ fontSize: 11, color: "#64748b" }}>
            🎯 לחץ על המפה למיקום רחפן
          </span>
        )}
      </div>

      <div
        style={{
          height: 28,
          width: 1,
          background: "#e2e8f0",
        }}
      />

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={onOpenForm}
          style={{
            padding: "6px 12px",
            borderRadius: 7,
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#475569",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          טופס תקיפה
        </button>

        <button
          type="button"
          onClick={onFinish}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            border: "none",
            background: isCompleted
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #873535 0%, #ad4242 100%)",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          {isCompleted ? "סיום הצבה ✓" : "סיום הצבה"}
        </button>
      </div>
    </div>
  );
};
