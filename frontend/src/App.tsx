import React from 'react';
import { MainLayout } from './layouts/MainLayout';

export default function App() {
  const handleStartSimulation = () => {
    console.log('Simulation initiated');
  };

  return (
    <MainLayout
      scenarioName="רב-זירתי - צפון ומזרח"
      simId="SIM-01"
      onStartSimulation={handleStartSimulation}
    />
  );
}

