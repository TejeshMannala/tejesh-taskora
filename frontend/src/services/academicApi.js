import api from './api';
import { FALLBACK_PREFIX, fallbackGroups } from '../constants/academic';

export const academicApi = {
  getEducationTypes: () => api.get('/api/v1/education/types').then(r => r.data),

  getGroups: async (educationType) => {
    const params = educationType ? `?educationType=${encodeURIComponent(educationType)}` : '';
    try {
      const response = await api.get(`/api/v1/academic/groups${params}`);
      const data = response.data;
      if (data.groups && data.groups.length > 0) {
        return data;
      }
    } catch {
    }
    const groups = fallbackGroups(educationType);
    return { success: true, groups };
  },

  isFallbackId: (id) => typeof id === 'string' && id.startsWith(FALLBACK_PREFIX),

  resolveGroupName: (fallbackId) => {
    if (!fallbackId || !fallbackId.startsWith(FALLBACK_PREFIX)) return null;
    return fallbackId.slice(FALLBACK_PREFIX.length).split(':').pop();
  },

  getSubjects: (groupId) => {
    const params = groupId ? `?group=${encodeURIComponent(groupId)}` : '';
    return api.get(`/api/v1/academic/subjects${params}`).then(r => r.data);
  },

  getRoadmap: (subjectId) => {
    const params = subjectId ? `?subject=${encodeURIComponent(subjectId)}` : '';
    return api.get(`/api/v1/academic/roadmap${params}`).then(r => r.data);
  },

  getSyllabus: (groupId) => {
    const params = groupId ? `?group=${encodeURIComponent(groupId)}` : '';
    return api.get(`/api/v1/academic/syllabus${params}`).then(r => r.data);
  },
};
