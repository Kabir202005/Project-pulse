import { request } from './api';
import {
  TrainResponse,
  ModelStatus,
  PredictionInput,
  PredictionResult,
} from '../types';

export const predictionService = {
  getStatus: async (): Promise<ModelStatus> => {
    return request<ModelStatus>('/prediction/status');
  },

  trainModels: async (): Promise<TrainResponse> => {
    return request<TrainResponse>('/prediction/train', {
      method: 'POST',
    });
  },

  predict: async (input: PredictionInput): Promise<PredictionResult> => {
    return request<PredictionResult>('/prediction/predict', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
