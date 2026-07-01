import api from './api';

export const achievementApi = {
  getAll: () => api.get('/api/v1/achievements').then(r => r.data),
  check: () => api.post('/api/v1/achievements/check').then(r => r.data),
  seed: () => api.post('/api/v1/achievements/seed').then(r => r.data),
};
