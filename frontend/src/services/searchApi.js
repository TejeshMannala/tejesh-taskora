import api from './api';

export const searchApi = {
  global: (q) => api.get('/api/v1/search', { params: { q } }).then(r => r.data),
};
