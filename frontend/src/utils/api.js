import axios from 'axios';

// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor to attach authorization token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method, config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Handle common errors
    console.error('API Error:', error.response?.status, error.response?.data, error.config?.url);
    if (error.response && error.response.status === 401) {
      // Unauthorized - could redirect to login or handle as needed
      console.error('Unauthorized access attempt');
      // Optional: localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api; 