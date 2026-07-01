import api from './api';

export const subjectApi = {
  getAll: () => api.get('/api/v1/subjects').then(r => r.data),
  create: (data) => api.post('/api/v1/subjects', data).then(r => r.data),
  update: (id, data) => api.put(`/api/v1/subjects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/v1/subjects/${id}`).then(r => r.data),
  getProgress: (id) => api.get(`/api/v1/subjects/${id}/progress`).then(r => r.data),
};
