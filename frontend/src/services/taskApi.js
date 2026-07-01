import api from './api';

export const taskApi = {
  getAll: (params) => api.get('/api/v1/tasks', { params }).then(r => r.data),
  getById: (id) => api.get(`/api/v1/tasks/${id}`).then(r => r.data),
  create: (data) => api.post('/api/v1/tasks', data).then(r => r.data),
  update: (id, data) => api.put(`/api/v1/tasks/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/v1/tasks/${id}`).then(r => r.data),
  toggle: (id) => api.patch(`/api/v1/tasks/${id}/toggle`).then(r => r.data),
  getStats: () => api.get('/api/v1/tasks/stats').then(r => r.data),
};
