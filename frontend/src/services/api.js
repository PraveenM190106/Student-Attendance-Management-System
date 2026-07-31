import axios from 'axios';

// Get target API URL with production fallback
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // In production builds, default to deployed Render backend if environment variable is not defined
  if (import.meta.env.PROD) {
    return 'https://student-attendance-management-system-1h4o.onrender.com/api';
  }
  return '/api';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Clean error message handling
api.interceptors.response.use(
  (response) => {
    // If backend returns HTML (e.g. fallback SPA index.html), throw error
    if (typeof response.data === 'string' && (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html'))) {
      throw new Error('API routing error: Received HTML response instead of JSON. Check backend API URL configuration.');
    }
    return response.data;
  },
  (error) => {
    let message = 'An API error occurred';
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        if (error.response.data.includes('<!DOCTYPE html>') || error.response.data.includes('<html')) {
          message = 'API routing error: Received HTML response instead of JSON. Check backend API URL configuration.';
        } else {
          message = error.response.data;
        }
      } else if (error.response.data.message) {
        message = error.response.data.message;
      }
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
