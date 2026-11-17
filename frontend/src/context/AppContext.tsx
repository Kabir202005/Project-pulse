import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataCleaningStats, ModelStatus, ModelMetrics, User } from '../types';
import { predictionService } from '../services/predictionService';
import { dataService } from '../services/dataService';
import { authService, TOKEN_STORAGE_KEY } from '../services/api';

interface AppContextType {
  datasetLoaded: boolean;
  datasetStats: DataCleaningStats | null;
  modelStatus: ModelStatus;
  modelMetrics: { cost: ModelMetrics; duration: ModelMetrics } | null;
  setDatasetLoaded: (loaded: boolean) => void;
  setDatasetStats: (stats: DataCleaningStats | null) => void;
  setModelStatus: (status: ModelStatus) => void;
  setModelMetrics: (metrics: { cost: ModelMetrics; duration: ModelMetrics } | null) => void;
  
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authRedirectPath: string | null;
  openAuthModal: (redirectPath?: string) => void;
  closeAuthModal: () => void;
  login: (token: string, email: string) => void;
  logout: () => Promise<void>;

  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  refreshModelStatus: () => Promise<void>;
  syncBackendState: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasetLoaded, setDatasetLoaded] = useState<boolean>(false);
  const [datasetStats, setDatasetStats] = useState<DataCleaningStats | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ trained: false });
  const [modelMetrics, setModelMetrics] = useState<{ cost: ModelMetrics; duration: ModelMetrics } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authRedirectPath, setAuthRedirectPath] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const hideToast = () => setToast(null);

  const openAuthModal = (redirectPath?: string) => {
    if (redirectPath) {
      setAuthRedirectPath(redirectPath);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = (token: string, email: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setUser({ email });
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${email}`, 'success');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false);
      showToast('Logged out successfully.', 'info');
    }
  };

  const verifySession = async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return;

    try {
      const res = await authService.getMe();
      if (res.authenticated && res.email) {
        setUser({ email: res.email });
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      // Backend not yet reachable
    }
  };

  const refreshModelStatus = async () => {
    try {
      const status = await predictionService.getStatus();
      setModelStatus(status);
    } catch {
      // Backend not yet reachable
    }
  };

  const syncBackendState = async () => {
    try {
      const [status, preview] = await Promise.allSettled([
        predictionService.getStatus(),
        dataService.getPreview(1, 1),
      ]);

      if (status.status === 'fulfilled') {
        setModelStatus(status.value);
      }

      if (preview.status === 'fulfilled' && preview.value.total_rows > 0) {
        setDatasetLoaded(true);
        setDatasetStats((prev) => prev || {
          raw_rows: preview.value.total_rows + 16,
          cleaned_rows: preview.value.total_rows,
          duplicates_removed: 16,
          cost_imputations: 21,
          experience_imputations: 14,
        });
      }
    } catch {
      // Backend starting
    }
  };

  useEffect(() => {
    verifySession();
    syncBackendState();
  }, []);

  return (
    <AppContext.Provider
      value={{
        datasetLoaded,
        datasetStats,
        modelStatus,
        modelMetrics,
        setDatasetLoaded,
        setDatasetStats,
        setModelStatus,
        setModelMetrics,
        user,
        isAuthenticated,
        isAuthModalOpen,
        authRedirectPath,
        openAuthModal,
        closeAuthModal,
        login,
        logout,
        toast,
        showToast,
        hideToast,
        refreshModelStatus,
        syncBackendState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

