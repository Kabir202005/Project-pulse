import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { AuthRequiredState } from './components/StatusStates';

import { DataCenter } from './pages/DataCenter';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { PerformanceDrivers } from './pages/PerformanceDrivers';
import { InteractiveVisualizations } from './pages/InteractiveVisualizations';
import { AiEstimator } from './pages/AiEstimator';
import { SmartResourceOptimizer } from './pages/SmartResourceOptimizer';
import { SensitivityWhatIf } from './pages/SensitivityWhatIf';
import { ProjectComparison } from './pages/ProjectComparison';
import { BusinessReport } from './pages/BusinessReport';

const ProtectedRoute: React.FC<{ children: React.ReactNode; featureName: string }> = ({
  children,
  featureName,
}) => {
  const { isAuthenticated, openAuthModal } = useApp();

  if (!isAuthenticated) {
    return (
      <AuthRequiredState
        featureName={featureName}
        onLoginClick={() => openAuthModal()}
      />
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Dashboard (accessible to all users without login) */}
            <Route path="/" element={<ExecutiveDashboard />} />
            <Route path="/dashboard" element={<ExecutiveDashboard />} />

            {/* Protected Modules (require authenticated session) */}
            <Route
              path="/data-center"
              element={
                <ProtectedRoute featureName="Data Center">
                  <DataCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance"
              element={
                <ProtectedRoute featureName="Analytics & Performance Drivers">
                  <PerformanceDrivers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visualizations"
              element={
                <ProtectedRoute featureName="Interactive Visualizations">
                  <InteractiveVisualizations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/estimator"
              element={
                <ProtectedRoute featureName="AI Cost & Timeline Estimator">
                  <AiEstimator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/optimizer"
              element={
                <ProtectedRoute featureName="Smart Resource Optimizer">
                  <SmartResourceOptimizer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/what-if"
              element={
                <ProtectedRoute featureName="Sensitivity / What-If Analyzer">
                  <SensitivityWhatIf />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comparison"
              element={
                <ProtectedRoute featureName="Project Comparison Suite">
                  <ProjectComparison />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute featureName="Business Executive Report">
                  <BusinessReport />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
};

export default App;

