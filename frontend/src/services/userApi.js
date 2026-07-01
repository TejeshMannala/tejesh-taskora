import api from './api';

export const userApi = {
  getProfile: () => api.get('/api/v1/users/profile').then(r => r.data),
  updateProfile: (data) => api.put('/api/v1/users/profile', data).then(r => r.data),
  lockProfile: () => api.put('/api/v1/users/profile-lock').then(r => r.data),
  changePassword: (data) => api.put('/api/v1/users/password', data).then(r => r.data),
  deleteAccount: () => api.delete('/api/v1/users/account').then(r => r.data),
  updateStreak: () => api.patch('/api/v1/users/streak').then(r => r.data),
  uploadAvatar: (data) => api.post('/api/v1/users/avatar', data).then(r => r.data),
  uploadProfileImage: (formData) => api.post('/api/v1/users/profile/image', formData).then(r => r.data),
};
