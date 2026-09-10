import L from "leaflet";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo } from "react";
import {
  getState,
  type DroneSimState,
  type SimulationState,
} from "../simulation/SimulationContext";

interface UseThreatSelectionOptions {
  map: L.Map | null;
  mapMoveTick: number;
  selectedThreatId: number | null;
  setSelectedThreatId: Dispatch<SetStateAction<number | null>>;
  state: SimulationState;
}

export const useThreatSelection = ({
  map,
  mapMoveTick,
  selectedThreatId,
  setSelectedThreatId,
  state,
}: UseThreatSelectionOptions) => {
  useEffect(() => {
    if (!map) return;

    const container = map.getContainer();
    let startX = 0;
    let startY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      startX = event.clientX;
      startY = event.clientY;
    };

    const handleContainerClick = (event: MouseEvent) => {
      const dragDist = Math.hypot(
        event.clientX - startX,
        event.clientY - startY,
      );
      if (dragDist > 6) return;

      const target = event.target as HTMLElement;
      if (target.closest(".drone-dialog-glass")) return;

      const currentState = getState();
      const activeThreats = Object.values(currentState.threats).filter(
        (threat) =>
          threat.logicalStatus === "active" ||
          threat.logicalStatus === "interceptPending",
      );

      if (activeThreats.length === 0) return;

      const markerEl = target.closest(".ashmoret-marker-threat");
      if (markerEl) {
        const match = markerEl.textContent?.match(/איום\s*(\d+)/);
        if (match) {
          const id = Number(match[1]);
          if (currentState.threats[id]) {
            setSelectedThreatId(id);
            return;
          }
        }
      }

      const clickPoint = map.mouseEventToContainerPoint(event);
      let closestThreat: DroneSimState | null = null;
      let minDistance = Infinity;

      for (const threat of activeThreats) {
        const threatPoint = map.latLngToContainerPoint([
          threat.location.latitude,
          threat.location.longitude,
        ]);
        const distance = Math.hypot(
          threatPoint.x - clickPoint.x,
          threatPoint.y - clickPoint.y,
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestThreat = threat;
        }
      }

      if (closestThreat && minDistance <= 35) {
        setSelectedThreatId(closestThreat.id);
      } else if (minDistance > 50) {
        setSelectedThreatId(null);
      }
    };

    container.addEventListener("mousedown", handleMouseDown, true);
    container.addEventListener("click", handleContainerClick, true);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown, true);
      container.removeEventListener("click", handleContainerClick, true);
    };
  }, [map, setSelectedThreatId]);

  const currentThreat =
    selectedThreatId !== null ? state.threats[selectedThreatId] : null;

  const isThreatNeutralized =
    !currentThreat ||
    currentThreat.logicalStatus === "intercepted" ||
    currentThreat.logicalStatus === "impacted";

  useEffect(() => {
    if (selectedThreatId !== null && isThreatNeutralized) {
      setSelectedThreatId(null);
    }
  }, [selectedThreatId, isThreatNeutralized, setSelectedThreatId]);

  const modalPosition = useMemo(() => {
    void mapMoveTick;

    if (!currentThreat || !map || isThreatNeutralized) return null;

    const point = map.latLngToContainerPoint([
      currentThreat.location.latitude,
      currentThreat.location.longitude,
    ]);

    return { x: point.x, y: point.y };
  }, [currentThreat, map, isThreatNeutralized, mapMoveTick]);

  return {
    currentThreat,
    isThreatNeutralized,
    modalPosition,
  };
};
