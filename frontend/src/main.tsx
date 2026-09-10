import './styles/theme.css';
import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";
import {App} from "./App";
import { SimulationProvider } from "./simulation/SimulationProvider";
import { DroneProvider, LauncherProvider } from "./contexts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <SimulationProvider>
      <DroneProvider>
        <LauncherProvider>
          <App />
        </LauncherProvider>
      </DroneProvider>
    </SimulationProvider>

  </React.StrictMode>,
);
