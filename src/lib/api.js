import axios from 'axios';
import { getInitData } from './telegram';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const initData = getInitData();

  if (initData) {
    config.headers = config.headers || {};
    config.headers['X-Init-Data'] = initData;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (detail === 'not_registered') {
      window.dispatchEvent(new CustomEvent('auth:not_registered'));
    } else if (detail === 'pending_approval') {
      window.dispatchEvent(new CustomEvent('auth:pending'));
    } else if (detail === 'suspended') {
      window.dispatchEvent(new CustomEvent('auth:suspended'));
    } else if (status === 401) {
      window.dispatchEvent(new CustomEvent('auth:invalid'));
    }

    return Promise.reject(error);
  }
);

export default api;
