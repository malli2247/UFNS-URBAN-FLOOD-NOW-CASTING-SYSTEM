import React, { useState } from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { FloodMap } from './components/map/FloodMap';
import { RainfallNowcastView } from './components/nowcast/RainfallNowcastView';
import { DrainageGraphView } from './components/drainage/DrainageGraphView';
import { SafeRoutePlanner } from './components/routing/SafeRoutePlanner';
import { ModelValidationView } from './components/validation/ModelValidationView';
import { SensorsView } from './components/sensors/SensorsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ArchitectureView } from './components/architecture/ArchitectureView';
import { DataSourcesView } from './components/sources/DataSourcesView';
import { ModelCardView } from './components/model/ModelCardView';
import { PresentationMode } from './components/presentation/PresentationMode';
import { DigitalTwinPage } from './components/digitaltwin/DigitalTwinPage';
import { MetropolitanOverviewView } from './components/overview/MetropolitanOverviewView';

const MainLayout: React.FC = () => {
  const { activeTab, presentationMode, isDigitalTwinOpen } = useSimulation();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'overview':
        return <MetropolitanOverviewView />;
      case 'map':
        return (
          <div className="h-[calc(100vh-65px)] w-full relative">
            <FloodMap compact={false} />
          </div>
        );
      case 'nowcast':
        return <RainfallNowcastView />;
      case 'drainage':
        return <DrainageGraphView />;
      case 'routing':
        return <SafeRoutePlanner />;
      case 'sensors':
        return <SensorsView />;
      case 'validation':
        return <ModelValidationView />;
      case 'model-card':
        return <ModelCardView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'architecture':
        return <ArchitectureView />;
      case 'sources':
        return <DataSourcesView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#090d16]">
          {renderContent()}
        </main>
      </div>
      {presentationMode && <PresentationMode />}
      {isDigitalTwinOpen && <DigitalTwinPage />}
    </div>
  );
};

export function App() {
  const [hasLaunched, setHasLaunched] = useState(() => {
    return typeof window !== 'undefined' && window.location.hash.includes('digital-twin');
  });

  return (
    <SimulationProvider>
      {!hasLaunched ? (
        <LandingPage onLaunch={() => setHasLaunched(true)} />
      ) : (
        <MainLayout />
      )}
    </SimulationProvider>
  );
}

export default App;
