import api from './api';

export const scheduleApi = {
  getAll: (params) => api.get('/api/v1/schedules', { params }).then(r => r.data),
  create: (data) => api.post('/api/v1/schedules', data).then(r => r.data),
  update: (id, data) => api.put(`/api/v1/schedules/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/v1/schedules/${id}`).then(r => r.data),
  getToday: () => api.get('/api/v1/schedules/today').then(r => r.data),
  getWeekly: () => api.get('/api/v1/schedules/weekly').then(r => r.data),
};
