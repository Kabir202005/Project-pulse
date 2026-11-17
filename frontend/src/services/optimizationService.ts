import { request } from './api';
import { OptimizationInput, OptimizationResult } from '../types';

export const optimizationService = {
  optimize: async (input: OptimizationInput): Promise<OptimizationResult> => {
    return request<OptimizationResult>('/optimization/resources', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
