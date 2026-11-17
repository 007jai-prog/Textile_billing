import { api } from './api';

export const reportService = {
  getDashboardMetrics: async () => {
    const res = await api.get('/dashboard/metrics');
    return res.data;
  },

  getSalesReport: async (rangeType = 'this_month', customStart = null, customEnd = null) => {
    const params = new URLSearchParams();
    params.append('range_type', rangeType);
    if (customStart) params.append('custom_start', customStart);
    if (customEnd) params.append('custom_end', customEnd);

    const res = await api.get(`/reports/sales?${params.toString()}`);
    return res.data;
  }
};
