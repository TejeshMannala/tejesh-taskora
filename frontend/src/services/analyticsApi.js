import api from './api';

export const analyticsApi = {
  getDashboard: () => api.get('/api/v1/analytics/dashboard').then(r => r.data),
  getWeekly: () => api.get('/api/v1/analytics/weekly').then(r => r.data),
  getMonthly: (params) => api.get('/api/v1/analytics/monthly', { params }).then(r => r.data),
  getSubjectPerformance: () => api.get('/api/v1/analytics/subjects').then(r => r.data),
};
