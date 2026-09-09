import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import App from './App';
import { SimulationProvider } from './simulation/SimulationProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <SimulationProvider>
      <App />
    </SimulationProvider>
  </React.StrictMode>,
);
