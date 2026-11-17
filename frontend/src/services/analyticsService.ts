import { request } from './api';
import {
  PortfolioData,
  PerformanceDimensionData,
  DriverCorrelation,
  VisualizationsData,
} from '../types';

export const analyticsService = {
  getPortfolio: async (): Promise<PortfolioData> => {
    return request<PortfolioData>('/analytics/portfolio');
  },

  getPerformance: async (dimension = 'terrain_type'): Promise<PerformanceDimensionData> => {
    return request<PerformanceDimensionData>(`/analytics/performance?dimension=${dimension}`);
  },

  getDrivers: async (): Promise<{ correlations: DriverCorrelation[] }> => {
    return request<{ correlations: DriverCorrelation[] }>('/analytics/drivers');
  },

  getVisualizations: async (): Promise<VisualizationsData> => {
    return request<VisualizationsData>('/analytics/visualizations');
  },
};
