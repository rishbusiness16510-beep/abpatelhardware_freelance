import axios from 'axios';

const isProd = import.meta.env.PROD;
const baseURL = import.meta.env.VITE_API_URL || (isProd ? import.meta.env.VITE_API_URL_PROD : import.meta.env.VITE_API_URL_DEV);

const api = axios.create({
  baseURL: baseURL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('abpatel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('abpatel_token');
      localStorage.removeItem('abpatel_user');
      // Redirect to login if on admin pages
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
