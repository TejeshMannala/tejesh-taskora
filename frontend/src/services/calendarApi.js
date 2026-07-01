import api from './api';

export const calendarApi = {
  getAll: (params) => api.get('/api/v1/calendar', { params }).then(r => r.data),
  create: (data) => api.post('/api/v1/calendar', data).then(r => r.data),
  update: (id, data) => api.put(`/api/v1/calendar/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/v1/calendar/${id}`).then(r => r.data),
  getConsolidated: (params) => api.get('/api/v1/calendar/consolidated', { params }).then(r => r.data),
};
