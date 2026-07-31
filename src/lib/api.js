import axios from 'axios';
import { getInitData } from './telegram';

/* 🔥 گرم‌کردن اتصال (موج ۴.۶۰): لینک preconnect
   به مبدأ API قبل از اولین درخواست تزریق می‌شود
   تا handshake ِ TLS از قبل آماده باشد — اولین
   ریکوئست واقعی دیگر هزینه‌ی اتصال ندارد.
   dns-prefetch هم به‌عنوان fallback سبک. */
try {
  const apiOrigin = new URL(
    import.meta.env?.VITE_API_URL ||
      'http://localhost:8000'
  ).origin;

  if (
    typeof document !== 'undefined' &&
    !apiOrigin.startsWith('http://localhost')
  ) {
    const preconnect =
      document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = apiOrigin;

    const dnsPrefetch =
      document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = apiOrigin;

    document.head.append(
      preconnect,
      dnsPrefetch
    );
  }
} catch (_) {
  /* در صورت خطا، بدون preconnect ادامه می‌دهیم */
}

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:8000',
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
