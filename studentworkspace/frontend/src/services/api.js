import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082';

const api = axios.create({
  baseURL: API_BASE_URL,
  // FIX: 30s timeout - 5s was too short for file uploads and slow connections
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // FIX: only force-logout on 401, not 403; don't redirect if already on login
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/login' ||
                          window.location.pathname === '/register';
      if (!isLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
