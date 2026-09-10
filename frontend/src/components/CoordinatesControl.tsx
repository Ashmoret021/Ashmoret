import React from "react";

interface Coordinates {
  lat: number;
  lng: number;
}

interface CoordinatesControlProps {
  coords: Coordinates | null;
}

export const CoordinatesControl: React.FC<CoordinatesControlProps> = ({
  coords,
}) => {
  return (
    <div
      className="leaflet-bottom leaflet-left"
      style={{
        pointerEvents: "none",
        position: "absolute",
        zIndex: 1000,
        bottom: 0,
        left: 0,
      }}
    >
      <div
        className="leaflet-control"
        style={{
          pointerEvents: "auto",
          margin: "0 0 10px 10px",
          padding: "4px 8px",
          backgroundColor: "rgba(16, 28, 49, 0.95)",
          backdropFilter: "blur(4px)",
          borderRadius: "4px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.45)",
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#f1f5f9",
          userSelect: "none",
          border: "1px solid #1c2e4f",
        }}
      >
        {coords ? (
          <span>
            x: {coords.lat.toFixed(5)}, y: {coords.lng.toFixed(5)}
          </span>
        ) : (
          <span style={{ color: "#fcfcfc" }}>x: ---, y: ---</span>
        )}
      </div>
    </div>
  );
};
