import { useCallback, useEffect, useRef } from "react";
import { algorithmClient } from "../algorithm/AlgorithmClient";
import { WorldSnapshotBuilder } from "../algorithm/WorldSnapshotBuilder";
import type { LeafletRenderer } from "../map/LeafletRenderer";
import { sampleScenario } from "../simulation/sampleScenario";
import {
  appendLog,
  finishClock,
  getState,
  loadScenario,
  onTick,
  setState,
  stopClock,
} from "../simulation/SimulationContext";
import {
  activateWaitingThreats,
  advanceThreatPositions,
} from "../simulation/ThreatEngine";
import { visualEventQueue } from "../visual/VisualEventQueue";
import { processEngagementDecision } from "../visual/VisualEventBuilder";

interface UseSimulationRuntimeOptions {
  onThreatSelectionClear: () => void;
  startClock: () => void;
}

export const useSimulationRuntime = ({
  onThreatSelectionClear,
  startClock,
}: UseSimulationRuntimeOptions) => {
  const rendererRef = useRef<LeafletRenderer | null>(null);
  const engagedDronesRef = useRef<Set<number>>(new Set());
  const tickIdRef = useRef<number>(0);
  const lastApiTickSimTimeRef = useRef<number>(0);
  const pendingApiCallRef = useRef<boolean>(false);
  const simulationGenerationRef = useRef<number>(0);

  const resetSimulationRefs = useCallback(() => {
    simulationGenerationRef.current += 1;
    tickIdRef.current = 0;
    lastApiTickSimTimeRef.current = 0;
    pendingApiCallRef.current = false;
    engagedDronesRef.current.clear();
  }, []);

  const clearEngagedDrones = useCallback(() => {
    engagedDronesRef.current.clear();
  }, []);

  const registerRenderer = useCallback((renderer: LeafletRenderer) => {
    rendererRef.current = renderer;
  }, []);

  useEffect(() => {
    const unsubscribe = onTick((_deltaTime, simTime) => {
      const state = getState();
      const { threats, status } = state;
      if (status !== "running") return;

      let updatedThreats = { ...threats };
      const prevThreats = updatedThreats;

      updatedThreats = activateWaitingThreats(updatedThreats, simTime);

      for (const [idStr, threat] of Object.entries(updatedThreats)) {
        if (
          threat.logicalStatus === "active" &&
          prevThreats[Number(idStr)]?.logicalStatus === "waiting"
        ) {
          appendLog(
            "detection",
            "זיהוי איום",
            `איום #${idStr} זוהה באוויר`,
            threat.route[0],
          );
        }
      }

      updatedThreats = advanceThreatPositions(updatedThreats, simTime);

      for (const [idStr, threat] of Object.entries(updatedThreats)) {
        const id = Number(idStr);
        const prev = prevThreats[id];
        if (
          threat.progress >= 1 &&
          threat.logicalStatus !== "intercepted" &&
          threat.logicalStatus !== "impacted" &&
          prev?.logicalStatus !== "impacted"
        ) {
          updatedThreats = {
            ...updatedThreats,
            [id]: { ...threat, logicalStatus: "impacted" },
          };

          visualEventQueue.enqueue({
            id: `evt-impact-${id}`,
            type: "impact",
            startTime: simTime,
            targetId: `איום ${id}`,
            position: threat.location,
            status: "pending",
          });

          appendLog(
            "impact",
            "פגיעה בשטח",
            `איום #${id} (סוג: ${threat.type ?? "אויב"}) פגע בשטח`,
            threat.location,
          );
        }
      }

      if (updatedThreats !== prevThreats) {
        const freshThreats = getState().threats;
        for (const [idStr, threat] of Object.entries(updatedThreats)) {
          const freshThreat = freshThreats[Number(idStr)];
          if (freshThreat && freshThreat.logicalStatus === "intercepted") {
            updatedThreats[Number(idStr)] = {
              ...threat,
              logicalStatus: "intercepted",
            };
          }
        }
        setState({ threats: updatedThreats });
      }

      if (
        !pendingApiCallRef.current &&
        simTime - lastApiTickSimTimeRef.current >= 1.0
      ) {
        lastApiTickSimTimeRef.current = simTime;
        pendingApiCallRef.current = true;
        tickIdRef.current += 1;

        const snapshot = WorldSnapshotBuilder.buildSnapshot(
          getState(),
          tickIdRef.current,
        );
        const capturedGeneration = simulationGenerationRef.current;

        algorithmClient.step(snapshot).then((response) => {
          pendingApiCallRef.current = false;
          if (capturedGeneration !== simulationGenerationRef.current) return;
          if (!response || !response.engagements) return;

          const currentState = getState();
          const nextThreats = { ...currentState.threats };
          let threatsStateUpdated = false;

          for (const decision of response.engagements) {
            const targetIdNum = Number(decision.targetId);
            if (
              !engagedDronesRef.current.has(targetIdNum) &&
              nextThreats[targetIdNum]?.logicalStatus === "active"
            ) {
              engagedDronesRef.current.add(targetIdNum);
              nextThreats[targetIdNum] = {
                ...nextThreats[targetIdNum],
                logicalStatus: "interceptPending",
              };
              threatsStateUpdated = true;

              const bundle = processEngagementDecision(decision, currentState);
              if (bundle) {
                visualEventQueue.enqueue(bundle.visualEvent);
                rendererRef.current?.registerInterceptorVisualState(
                  bundle.interceptorState,
                );

                appendLog(
                  "launch",
                  "שיגור מיירט",
                  `מיירט ${decision.interceptorType} שוגר מסוללה #${decision.defenseSystemId} לעבר איום #${decision.targetId}`,
                  bundle.interceptorState.startPosition,
                );

                const arrivalSimTime = simTime + 3;
                const checkRemoval = onTick((_dt, currentSimTime) => {
                  if (currentSimTime >= arrivalSimTime) {
                    const state = getState();
                    if (state.threats[targetIdNum]) {
                      const updated = {
                        ...state.threats,
                        [targetIdNum]: {
                          ...state.threats[targetIdNum],
                          logicalStatus: "intercepted" as const,
                        },
                      };
                      setState({ threats: updated });

                      appendLog(
                        "interception",
                        "יירוט מוצלח",
                        `איום #${targetIdNum} (סוג: ${state.threats[targetIdNum].type ?? "אויב"}) יורט בהצלחה`,
                        state.threats[targetIdNum].location,
                      );
                    }
                    checkRemoval();
                  }
                });
              }
            }
          }

          if (threatsStateUpdated) {
            const freshThreats = getState().threats;
            for (const [idStr, threat] of Object.entries(nextThreats)) {
              const freshThreat = freshThreats[Number(idStr)];
              if (freshThreat && freshThreat.logicalStatus === "intercepted") {
                nextThreats[Number(idStr)] = {
                  ...threat,
                  logicalStatus: "intercepted",
                };
              }
            }
            setState({ threats: nextThreats });
          }
        });
      }

      const allThreats = Object.values(updatedThreats);
      const allDone =
        allThreats.length > 0 &&
        allThreats.every(
          (threat) =>
            threat.logicalStatus === "intercepted" ||
            threat.logicalStatus === "impacted",
        );
      if (allDone && status === "running") {
        finishClock();
      }
    });

    return () => unsubscribe();
  }, []);

  const restartSimulation = useCallback(() => {
    onThreatSelectionClear();
    stopClock();
    algorithmClient.reset();
    resetSimulationRefs();
    visualEventQueue.clear();

    const renderer = rendererRef.current;
    renderer?.resetVisuals();

    loadScenario(sampleScenario);
    renderer?.initDefenseSystems();
    startClock();
  }, [onThreatSelectionClear, resetSimulationRefs, startClock]);

  useEffect(() => {
    return () => {
      rendererRef.current?.stop();
      rendererRef.current = null;
    };
  }, []);

  return {
    clearEngagedDrones,
    registerRenderer,
    resetSimulationRefs,
    restartSimulation,
  };
};
