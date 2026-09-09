import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapView } from './ui/MapView';
import { SimulationControls } from './ui/SimulationControls';
import { SimulationStats } from './ui/SimulationStats';
import { EventLog } from './ui/EventLog';
import { appendLog, finishClock, getState, loadScenario, onTick, setState, stopClock } from './simulation/SimulationContext';
import { sampleScenario } from './simulation/sampleScenario';
import { LeafletRenderer } from './map/LeafletRenderer';
import { visualEventQueue } from './visual/VisualEventQueue';
import { processEngagementDecision } from './visual/VisualEventBuilder';

export default function App() {
  const rendererRef = useRef<LeafletRenderer | null>(null);
  const engagedDronesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Load default realistic scenario once on mount
    loadScenario(sampleScenario);
    engagedDronesRef.current.clear();

    // ── Simulation Tick Processor ──────────────────────────────────────────
    // 1. Moves active drones along straight paths (origin -> destination)
    // 2. Simulates algorithm decision: triggers interception when threat is in range
    const unsubscribe = onTick((_deltaTime, simTime) => {
      const state = getState();
      const { threats, launchers, status } = state;
      if (status !== 'running') return;

      let changed = false;
      const updatedThreats = { ...threats };

      for (const [idStr, threat] of Object.entries(updatedThreats)) {
        const id = Number(idStr);

        // A. Threat Launch
        if (threat.logicalStatus === 'waiting' && simTime >= threat.startTime) {
          updatedThreats[id] = {
            ...threat,
            logicalStatus: 'active',
            visualStatus: 'flying',
            progress: 0,
            location: threat.route[0],
          };
          changed = true;

          appendLog(
            'detection',
            'זיהוי איום',
            `איום #${id} זוהה באוויר`,
            threat.route[0],
          );
        }
        // B. Threat Straight-Line Movement
        else if (threat.logicalStatus === 'active' || threat.logicalStatus === 'interceptPending') {
          const flightDuration = 35; // 35 seconds across the corridor
          const progress = Math.min(1, (simTime - threat.startTime) / flightDuration);

          if (threat.route && threat.route.length >= 2) {
            const start = threat.route[0];
            const end = threat.route[threat.route.length - 1];

            // Strict straight line (no turns)
            const currentPos = {
              latitude: start.latitude + (end.latitude - start.latitude) * progress,
              longitude: start.longitude + (end.longitude - start.longitude) * progress,
              asl: start.asl + (end.asl - start.asl) * progress,
              agl: start.agl + (end.agl - start.agl) * progress,
            };

            const isImpacted = progress >= 1;
            updatedThreats[id] = {
              ...threat,
              progress,
              location: currentPos,
              logicalStatus: isImpacted ? 'impacted' : threat.logicalStatus,
            };
            changed = true;

            // Trigger ground impact visual event if reached destination without interception
            if (isImpacted) {
              visualEventQueue.enqueue({
                id: `evt-impact-${id}`,
                type: 'impact',
                startTime: simTime,
                targetId: `איום ${id}`,
                position: currentPos,
                status: 'pending',
              });

              appendLog(
                'impact',
                'פגיעה בשטח',
                `איום #${id} (סוג: ${threat.type ?? 'אויב'}) פגע בשטח`,
                currentPos,
              );
              // Check if all threats are now finished via impact
              const allThreats = Object.values(updatedThreats);
              const allDone = allThreats.length > 0 && allThreats.every(
                (t) => t.logicalStatus === 'intercepted' || t.logicalStatus === 'impacted',
              );
              if (allDone) {
                const finishTime = simTime + 1.0;
                const checkFinish = onTick((_dt, time) => {
                  if (time >= finishTime) {
                    finishClock();
                    checkFinish();
                  }
                });
              }
            }
          }

          // C. Simulated Algorithm Interception Decision (Dev 2 / API Response Mock)
          // When drone has flown ~5-8 seconds into active airspace, launcher engages
          const timeSinceLaunch = simTime - threat.startTime;
          if (timeSinceLaunch >= 5 && !engagedDronesRef.current.has(id) && threat.logicalStatus === 'active') {
            engagedDronesRef.current.add(id);

            // Mark threat as interceptPending
            updatedThreats[id].logicalStatus = 'interceptPending';
            changed = true;

            // Match with defense launcher (IronHookSR for threat 1, ShieldNestLite for threat 2)
            const launcherId = id === 1 ? '101' : '102';
            const interceptorType = id === 1 ? 'DartFoxS' : 'SkyLanceM';

            // Process engagement decision via VisualEventBuilder (Dev 3 Mission 3.2)
            const bundle = processEngagementDecision(
              {
                defenseSystemId: launcherId,
                interceptorType,
                targetId: String(id),
                result: 'success',
              },
              state,
            );

            if (bundle) {
              visualEventQueue.enqueue(bundle.visualEvent);
              rendererRef.current?.registerInterceptorVisualState(bundle.interceptorState);

              appendLog(
                'launch',
                'שיגור מיירט',
                `מיירט ${interceptorType} שוגר מסוללה #${launcherId} לעבר איום #${id}`,
                bundle.interceptorState.startPosition,
              );

              // Schedule threat interception removal when missile arrives (approx 3 seconds)
              const arrivalSimTime = simTime + 3;
              const checkRemoval = onTick((_dt, currentSimTime) => {
                if (currentSimTime >= arrivalSimTime) {
                  const s = getState();
                  if (s.threats[id]) {
                    const nextThreats = {
                      ...s.threats,
                      [id]: { ...s.threats[id], logicalStatus: 'intercepted' as const },
                    };
                    setState({ threats: nextThreats });

                    appendLog(
                      'interception',
                      'יירוט מוצלח',
                      `איום #${id} (סוג: ${s.threats[id].type ?? 'אויב'}) יורט בהצלחה`,
                      s.threats[id].location,
                    );

                    // Check if all threats are now finished
                    const allThreats = Object.values(nextThreats);
                    const allDone = allThreats.length > 0 && allThreats.every(
                      (t) => t.logicalStatus === 'intercepted' || t.logicalStatus === 'impacted',
                    );
                    if (allDone) {
                      const finishTime = currentSimTime + 1.0;
                      const checkFinish = onTick((_dt, time) => {
                        if (time >= finishTime) {
                          finishClock();
                          checkFinish();
                        }
                      });
                    }
                  }
                  checkRemoval();
                }
              });
            }
          }
        }
      }

      if (changed) {
        setState({ threats: updatedThreats });
      }

      // Check if all threats in current tick are finished
      const allThreats = Object.values(updatedThreats);
      const allDone = allThreats.length > 0 && allThreats.every(
        (t) => t.logicalStatus === 'intercepted' || t.logicalStatus === 'impacted',
      );
      if (allDone && status === 'running') {
        finishClock();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleMapReady = useCallback((map: L.Map) => {
    // Create LeafletRenderer for 60 FPS visual rendering decoupled from sim logic
    const renderer = new LeafletRenderer(map);
    rendererRef.current = renderer;

    renderer.initDefenseSystems();
    renderer.start();
  }, []);

  // ── Restart Handler ────────────────────────────────────────────────────────
  // Called by SimulationControls restart button.
  // Fully resets simulation state, visual state, and engaged-drones tracking.
  const handleRestart = useCallback(() => {
    stopClock();

    // Clear engaged-drones set so they can be re-engaged on next run
    engagedDronesRef.current.clear();

    // Clear all visual events
    visualEventQueue.clear();

    // Reset renderer (clears all map markers & interceptor states)
    const renderer = rendererRef.current;
    if (renderer) {
      renderer.resetVisuals();
    }

    // Reload scenario — resets all threats back to 'waiting' and launchers to initial state
    loadScenario(sampleScenario);

    // Re-initialize defense markers (launchers) after scenario reload
    if (renderer) {
      renderer.initDefenseSystems();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.stop();
        rendererRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ height: '100vh', position: 'relative', width: '100vw', overflow: 'hidden' }}>
      {/* Central Map View with LeafletRenderer callback */}
      <MapView onMapReady={handleMapReady} />

      {/* Mission 4.3: Chronological Event Log */}
      <EventLog />

      {/* Mission 4.2: Simulation Stats HUD */}
      <SimulationStats />

      {/* Mission 4.1: Simulation Control Bar */}
      <SimulationControls onRestart={handleRestart} />
    </div>
  );
}
