import api from './api';

export const alarmApi = {
  getActive: () => api.get('/api/v1/alarms/active').then(r => r.data),
  getHistory: () => api.get('/api/v1/alarms/history').then(r => r.data),
  acknowledge: (taskId) => api.post(`/api/v1/alarms/${taskId}/acknowledge`).then(r => r.data),
  complete: (taskId) => api.post(`/api/v1/alarms/${taskId}/complete`).then(r => r.data),
};
