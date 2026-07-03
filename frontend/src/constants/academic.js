export const FALLBACK_PREFIX = 'fb:';

export const FALLBACK_EDUCATION_TYPES = [
  'Intermediate',
  'Degree',
  'Engineering',
  'Diploma',
  'Postgraduate',
];

export const GROUP_MAP = {
  Intermediate: ['MPC', 'BiPC', 'MEC', 'CEC', 'HEC', 'Other'],
  Degree: ['BSc', 'BCom', 'BA', 'BCA', 'BBA', 'Other'],
  Engineering: ['CSE', 'CSE-AI', 'CSE-DS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'Other'],
  Diploma: ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'],
  Postgraduate: ['MCA', 'MBA', 'MTech', 'MSc', 'MCom', 'Other'],
};

export const fallbackGroups = (educationType) => {
  const names = educationType ? GROUP_MAP[educationType] : [];
  if (!names) return [];
  return names.map((name) => ({
    _id: `${FALLBACK_PREFIX}${educationType}:${name}`,
    name,
    educationType,
  }));
};

export const isFallbackId = (id) => typeof id === 'string' && id.startsWith(FALLBACK_PREFIX);

export const resolveFallbackGroupName = (fallbackId) => {
  if (!fallbackId || !isFallbackId(fallbackId)) return null;
  return fallbackId.slice(FALLBACK_PREFIX.length).split(':').pop();
};
