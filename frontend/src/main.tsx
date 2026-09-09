import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline } from "@mui/material";
import App from "./App";
import { AttackerProvider, DefenseProvider } from "./contexts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <AttackerProvider>
      <DefenseProvider>
        <App />
      </DefenseProvider>
    </AttackerProvider>
  </React.StrictMode>,
);
