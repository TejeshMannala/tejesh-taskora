import axios from 'axios';

const RAW_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = RAW_API_BASE.replace(/\/api\/v1\/?$/, '');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { reachable: true, healthy: false, status: res.status };
    const data = await res.json();
    return { reachable: true, healthy: data.mode === 'normal', mode: data.mode, data };
  } catch {
    return { reachable: false, healthy: false, mode: 'down' };
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/api/v1/auth/google-login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out:', error.config?.url);
    }
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error — server may be down:', error.config?.url);
    }
    if (error.response?.status === 503) {
      console.warn('Backend database unavailable — service degraded');
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
export default api;
