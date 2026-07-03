import api from './api';

export const semesterApi = {
  getAll: () => api.get('/api/v1/semesters').then(r => r.data),
  init: () => api.post('/api/v1/semesters/init').then(r => r.data),
  activate: (semesterId) => api.post('/api/v1/semesters/activate', { semesterId }).then(r => r.data),
  complete: (semesterId) => api.post('/api/v1/semesters/complete', { semesterId }).then(r => r.data),
  getSubjects: (semesterId) => api.get(`/api/v1/semesters/${semesterId}/subjects`).then(r => r.data),
  getProgress: () => api.get('/api/v1/semesters/progress').then(r => r.data),
};
