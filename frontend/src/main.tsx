import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";
import App from "./App";
import { DroneProvider, LauncherProvider } from "./contexts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <DroneProvider>
      <LauncherProvider>
        <App />
      </LauncherProvider>
    </DroneProvider>
  </React.StrictMode>,
);
