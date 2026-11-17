import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('texbill_token') || sessionStorage.getItem('texbill_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthUrl =
        error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/register') ||
        error.config.url.includes('/auth/oauth') ||
        error.config.url.includes('/auth/forgot-password');

      if (!isAuthUrl) {
        localStorage.removeItem('texbill_token');
        localStorage.removeItem('texbill_user');
        sessionStorage.removeItem('texbill_token');
        sessionStorage.removeItem('texbill_user');

        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/signin' &&
          window.location.pathname !== '/'
        ) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);