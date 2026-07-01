import api from './api';

export const academicApi = {
  getGroups: (educationType) => {
    const params = educationType ? `?educationType=${encodeURIComponent(educationType)}` : '';
    return api.get(`/api/v1/academic/groups${params}`).then(r => r.data);
  },
  getSubjects: (groupId) => {
    const params = groupId ? `?group=${groupId}` : '';
    return api.get(`/api/v1/academic/subjects${params}`).then(r => r.data);
  },
  getRoadmap: (subjectId) => {
    const params = subjectId ? `?subject=${subjectId}` : '';
    return api.get(`/api/v1/academic/roadmap${params}`).then(r => r.data);
  },
};
