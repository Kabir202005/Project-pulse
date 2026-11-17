import { request } from './api';
import { ComparisonProject } from '../types';

export const comparisonService = {
  getAvailableProjectIds: async (): Promise<string[]> => {
    return request<string[]>('/projects/ids');
  },

  compareProjects: async (projectIds: string[]): Promise<{ projects: ComparisonProject[] }> => {
    return request<{ projects: ComparisonProject[] }>('/projects/compare', {
      method: 'POST',
      body: JSON.stringify({ project_ids: projectIds }),
    });
  },
};
