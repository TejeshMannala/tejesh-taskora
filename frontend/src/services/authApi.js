import api from './api';

export const authApi = {
  login: (credentials) => api.post('/api/v1/auth/login', credentials).then(r => r.data),
  signup: (userData) => api.post('/api/v1/auth/signup', userData).then(r => r.data),
  getProfile: () => api.get('/api/v1/auth/profile').then(r => r.data),
  checkEmail: (email) => api.get(`/api/v1/auth/check-email?email=${email}`).then(r => r.data),
  acceptAgreement: () => api.post('/api/v1/auth/accept-agreement').then(r => r.data),
  googleLogin: (credential) => api.post('/api/v1/auth/google-login', { credential }).then(r => r.data),
  sendOTP: (email) => api.post('/api/v1/otp/send-otp', { email }).then(r => r.data),
  verifyOTP: (email, otp) => api.post('/api/v1/otp/verify', { email, otp }).then(r => r.data),
  resetPassword: (email, otp, newPassword) => api.post('/api/v1/otp/reset-password', { email, otp, newPassword }).then(r => r.data),
};
