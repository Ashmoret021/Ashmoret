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
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(4px)",
          borderRadius: "4px",
          boxShadow: "0 1px 5px rgba(0, 0, 0, 0.3)",
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#333",
          userSelect: "none",
          border: "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        {coords ? (
          <span>
            x: {coords.lng.toFixed(5)}, y: {coords.lat.toFixed(5)}
          </span>
        ) : (
          <span style={{ color: "#888" }}>x: ---, y: ---</span>
        )}
      </div>
    </div>
  );
};
