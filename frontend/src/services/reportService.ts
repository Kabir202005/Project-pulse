import { request } from './api';
import { BusinessReportData } from '../types';

export const reportService = {
  getBusinessReport: async (): Promise<BusinessReportData> => {
    return request<BusinessReportData>('/reports/business');
  },

  downloadBusinessReport: async (): Promise<Blob> => {
    return request<Blob>('/reports/business/download');
  },
};
