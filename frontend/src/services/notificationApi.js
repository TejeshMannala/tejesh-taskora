import api from './api';

export const notificationApi = {
  getAll: (params) => api.get('/api/v1/notifications', { params }).then(r => r.data),
  markRead: (id) => api.patch(`/api/v1/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/api/v1/notifications/read-all').then(r => r.data),
  delete: (id) => api.delete(`/api/v1/notifications/${id}`).then(r => r.data),
  getUnreadCount: () => api.get('/api/v1/notifications/unread-count').then(r => r.data),
};
