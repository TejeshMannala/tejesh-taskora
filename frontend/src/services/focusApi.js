import api from './api';

export const focusApi = {
  saveSession: (data) => api.post('/api/v1/focus/sessions', data).then(r => r.data),
  getSessions: (params) => api.get('/api/v1/focus/sessions', { params }).then(r => r.data),
  getTodayStats: () => api.get('/api/v1/focus/today').then(r => r.data),
};
