import axios from 'axios';

const RAW_API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_BASE =
  RAW_API_BASE.replace(/\/api\/v1\/?$/, '');

console.log('[API] Base URL:', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 90000,
});

const cache = new Map();
const CACHE_TTL = 30000;

// Automatic retry for Render sleeping backend (network errors / 503)
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get') {
      const entry = cache.get(config.url);
      if (entry && Date.now() - entry.time < CACHE_TTL) {
        return Promise.resolve({ data: entry.data, config, cached: true });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Backend health check
export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return {
        reachable: true,
        healthy: false,
        status: res.status,
      };
    }

    const data = await res.json();

    return {
      reachable: true,
      healthy: data.mode === 'normal',
      mode: data.mode,
      data,
    };
  } catch (error) {
    return {
      reachable: false,
      healthy: false,
      mode: 'down',
    };
  }
};

api.interceptors.response.use(
  (response) => {
    if (response.config?.method === 'get' && !response.cached) {
      cache.set(response.config.url, { data: response.data, time: Date.now() });
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    if (
      error.response?.status === 401 &&
      error.config?.url !== '/api/v1/auth/google-login'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/signup'
      ) {
        window.location.href = '/login';
      }
    }

    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timed out:', config?.url);
    }

    if (error.code === 'ERR_NETWORK') {
      console.error('[API] Network error — server may be down:', config?.url);
    }

    if (error.response?.status === 503) {
      console.warn('[API] Backend database unavailable — service degraded');
    }

    // Retry logic for network errors or 503 (Render sleeping backend)
    const shouldRetry =
      (error.code === 'ERR_NETWORK' || error.response?.status === 503 || error.code === 'ECONNABORTED') &&
      config &&
      !config._retryCount;

    if (shouldRetry) {
      config._retryCount = (config._retryCount || 0) + 1;

      if (config._retryCount <= MAX_RETRIES) {
        console.log(`[API] Retry ${config._retryCount}/${MAX_RETRIES} for ${config.url}...`);
        await sleep(RETRY_DELAY_MS * config._retryCount);
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;