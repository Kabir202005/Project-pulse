import { request } from './api';
import { DataUploadResponse, DataPreviewResponse } from '../types';

export const dataService = {
  uploadDataset: async (file: File): Promise<DataUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<DataUploadResponse>('/data/upload', {
      method: 'POST',
      body: formData,
    });
  },

  loadSampleDataset: async (): Promise<DataUploadResponse> => {
    return request<DataUploadResponse>('/data/sample', {
      method: 'POST',
    });
  },

  getPreview: async (page = 1, pageSize = 10, search = ''): Promise<DataPreviewResponse> => {
    const query = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      search,
    }).toString();
    return request<DataPreviewResponse>(`/data/preview?${query}`);
  },

  downloadCleanedCsv: async (): Promise<Blob> => {
    return request<Blob>('/data/download');
  },
};
