import "leaflet/dist/leaflet.css";
import "./styles/App.css";
import "./styles/droneStyles.css";
import { useCallback, useState } from "react";
import { CoordinatesControl } from "./components/CoordinatesControl";
import AttackSide from "./components/Attackside";
import { DefenseSide } from "./components/DefenseSide/defenseSide";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import DroneModal from "./components/DroneModal/DroneModal";
import { PlacementHUD } from "./components/PlacementHUD";
import { ToastNotification } from "./components/ToastNotification";
import { useAttackScenarioBuilder } from "./hooks/useAttackScenarioBuilder";
import { useLeafletMapController } from "./hooks/useLeafletMapController";
import { useSimulationRuntime } from "./hooks/useSimulationRuntime";
import { useThreatSelection } from "./hooks/useThreatSelection";
import { useToast } from "./hooks/useToast";
import { MainLayout } from "./layouts/MainLayout";
import { useSimulation } from "./simulation/useSimulation";
import { EventLog } from "./ui/EventLog";
import { SimulationControls } from "./ui/SimulationControls";
import { SimulationStats } from "./ui/SimulationStats";
import {
  calculateFlightDistance,
  getDroneHebrewName,
  getEstimatedDamage,
} from "./utils/threatPresentation";

export const App = () => {
  const { state, startClock } = useSimulation();
  const { toast, showToast } = useToast();
  const [defenseModalOpen, setDefenseModalOpen] = useState(false);
  const [selectedThreatId, setSelectedThreatId] = useState<number | null>(null);
  const [showMainAdditionalComponents, setShowMainAdditionalComponents] =
    useState(true);

  const clearSelectedThreat = useCallback(() => {
    setSelectedThreatId(null);
  }, []);

  const {
    clearEngagedDrones,
    registerRenderer,
    resetSimulationRefs,
    restartSimulation,
  } = useSimulationRuntime({
    onThreatSelectionClear: clearSelectedThreat,
    startClock,
  });

  const {
    coords,
    handleGoToCoordinates,
    handleLayersToggle,
    handleMapReady,
    handleRemoveMarker,
    hasMarker,
    layersMenuRef,
    layersOpen,
    map,
    mapInstanceRef,
    mapMoveTick,
    markersLayerRef,
    markersMapRef,
  } = useLeafletMapController({
    onClearEngagedDrones: clearEngagedDrones,
    onRendererReady: registerRenderer,
    onResetSimulationRefs: resetSimulationRefs,
  });

  const {
    activePlacement,
    attackDescription,
    attackModalOpen,
    attackName,
    closeDeleteModal,
    deleteModal,
    handleSaveScenario,
    handleStartPlacement,
    placedDrones,
    placingWaveId,
    setAttackDescription,
    setAttackModalOpen,
    setAttackName,
    setPlacingWaveId,
    setWaves,
    waves,
  } = useAttackScenarioBuilder({
    mapInstanceRef,
    markersLayerRef,
    markersMapRef,
    showToast,
  });

  const { currentThreat, isThreatNeutralized, modalPosition } =
    useThreatSelection({
      map,
      mapMoveTick,
      selectedThreatId,
      setSelectedThreatId,
      state,
    });

  return (
    <div
      className={placingWaveId !== null ? "placement-active-cursor" : ""}
      style={{
        height: "100vh",
        position: "relative",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <MainLayout
        simId="SIM-01"
        handleMapReady={handleMapReady}
        setShowMainAdditionalComponents={setShowMainAdditionalComponents}
        onGoToCoordinates={handleGoToCoordinates}
        onRemoveMarker={handleRemoveMarker}
        hasMarker={hasMarker}
        onAddDroneGroup={() => setAttackModalOpen(true)}
        onAddInterceptorGroup={() => setDefenseModalOpen(true)}
        layersOpen={layersOpen}
        onLayersToggle={handleLayersToggle}
        layersMenuRef={layersMenuRef}
        useDefaultMapLayer={false}
      />

      <CoordinatesControl coords={coords} />

      {selectedThreatId !== null && currentThreat && !isThreatNeutralized && (
        <DroneModal
          drone={currentThreat}
          position={modalPosition}
          droneName={`איום #${currentThreat.id}`}
          hebrewName={getDroneHebrewName(currentThreat.type)}
          flightDistance={calculateFlightDistance(currentThreat)}
          estimatedDamage={getEstimatedDamage(currentThreat.type)}
          onClose={() => setSelectedThreatId(null)}
        />
      )}

      {showMainAdditionalComponents && (
        <>
          <EventLog />
          <SimulationStats />
          <SimulationControls onRestart={restartSimulation} />
          <DefenseSide
            map={map}
            open={defenseModalOpen}
            onClose={() => setDefenseModalOpen(false)}
          />

          {activePlacement.activeWave && (
            <PlacementHUD
              activeWave={activePlacement.activeWave}
              placedCount={activePlacement.placedCount}
              remainingCount={activePlacement.remainingCount}
              totalRequired={activePlacement.totalRequired}
              onFinish={() => setPlacingWaveId(null)}
              onOpenForm={() => {
                setPlacingWaveId(null);
                setAttackModalOpen(true);
              }}
            />
          )}
        </>
      )}

      <AttackSide
        open={attackModalOpen}
        onClose={() => setAttackModalOpen(false)}
        waves={waves}
        setWaves={setWaves}
        placedDrones={placedDrones}
        onStartPlacement={handleStartPlacement}
        attackName={attackName}
        setAttackName={setAttackName}
        attackDescription={attackDescription}
        setAttackDescription={setAttackDescription}
        onSaveScenario={handleSaveScenario}
      />

      <DeleteConfirmModal
        open={deleteModal.open}
        title={deleteModal.title}
        message={deleteModal.message}
        onConfirm={deleteModal.onConfirm}
        onCancel={closeDeleteModal}
      />

      {toast && <ToastNotification toast={toast} />}
    </div>
  );
};
