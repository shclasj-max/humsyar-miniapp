import axios from 'axios';
import { getInitData } from './telegram';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
});

api.interceptors.request.use(cfg => {
  const d = getInitData();
  if (d) cfg.headers['X-Init-Data'] = d;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    const detail = err.response?.data?.detail;
    if (detail === 'not_registered') window.dispatchEvent(new CustomEvent('auth:not_registered'));
    else if (detail === 'pending_approval') window.dispatchEvent(new CustomEvent('auth:pending'));
    return Promise.reject(err);
  }
);

export default api;
