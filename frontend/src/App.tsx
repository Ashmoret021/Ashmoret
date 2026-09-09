import React from "react";
import { MainLayout } from "./layouts/MainLayout";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSimulation } from "./simulation/useSimulation";

export default function App() {
  
  const handleStartSimulation = () => {
    console.log("Simulation initiated");
  };

  return (
    <>
      <MainLayout
        scenarioName="רב-זירתי - צפון ומזרח"
        simId="SIM-01"
        onStartSimulation={handleStartSimulation}
      />
      
    </>
  );
}
