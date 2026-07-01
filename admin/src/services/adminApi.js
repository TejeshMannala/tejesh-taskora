import api from './api';

export const adminApi = {
  login: (credentials) => api.post('/api/v1/admin/login', credentials).then(r => r.data),
  getProfile: () => api.get('/api/v1/admin/profile').then(r => r.data),
  getDashboard: () => api.get('/api/v1/admin/dashboard').then(r => r.data),

  getDegrees: () => api.get('/api/v1/admin/degrees').then(r => r.data),
  createDegree: (data) => api.post('/api/v1/admin/degrees', data).then(r => r.data),
  updateDegree: (id, data) => api.put(`/api/v1/admin/degrees/${id}`, data).then(r => r.data),
  deleteDegree: (id) => api.delete(`/api/v1/admin/degrees/${id}`).then(r => r.data),

  getCourses: () => api.get('/api/v1/admin/courses').then(r => r.data),
  createCourse: (data) => api.post('/api/v1/admin/courses', data).then(r => r.data),
  updateCourse: (id, data) => api.put(`/api/v1/admin/courses/${id}`, data).then(r => r.data),
  deleteCourse: (id) => api.delete(`/api/v1/admin/courses/${id}`).then(r => r.data),

  getGroups: (courseId) => api.get(`/api/v1/admin/groups${courseId ? `/${courseId}` : ''}`).then(r => r.data),
  createGroup: (data) => api.post('/api/v1/admin/groups', data).then(r => r.data),
  updateGroup: (id, data) => api.put(`/api/v1/admin/groups/${id}`, data).then(r => r.data),
  deleteGroup: (id) => api.delete(`/api/v1/admin/groups/${id}`).then(r => r.data),

  getSubjects: (params) => api.get('/api/v1/admin/subjects', { params }).then(r => r.data),
  createSubject: (data) => api.post('/api/v1/admin/subjects', data).then(r => r.data),
  updateSubject: (id, data) => api.put(`/api/v1/admin/subjects/${id}`, data).then(r => r.data),
  deleteSubject: (id) => api.delete(`/api/v1/admin/subjects/${id}`).then(r => r.data),

  getUsers: (params) => api.get('/api/v1/admin/users', { params }).then(r => r.data),
  getUserById: (id) => api.get(`/api/v1/admin/users/${id}`).then(r => r.data),
  updateUser: (id, data) => api.put(`/api/v1/admin/users/${id}`, data).then(r => r.data),
  deleteUser: (id) => api.delete(`/api/v1/admin/users/${id}`).then(r => r.data),

  getTasks: (params) => api.get('/api/v1/admin/tasks', { params }).then(r => r.data),
  deleteTask: (id) => api.delete(`/api/v1/admin/tasks/${id}`).then(r => r.data),

  seedData: () => api.post('/api/v1/admin/academic/seed').then(r => r.data),

  getNotes: (params) => api.get('/api/v1/admin/notes', { params }).then(r => r.data),
  createNote: (formData) => api.post('/api/v1/admin/notes', formData).then(r => r.data),
  updateNote: (id, formData) => api.put(`/api/v1/admin/notes/${id}`, formData).then(r => r.data),
  deleteNote: (id) => api.delete(`/api/v1/admin/notes/${id}`).then(r => r.data),
};
