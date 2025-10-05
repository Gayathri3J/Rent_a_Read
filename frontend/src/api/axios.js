import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api', // Backend API URL from env
  withCredentials: true,
});

// Request Interceptor: This runs BEFORE each request is sent.
api.interceptors.request.use(
  (config) => {
    // Get user info from localStorage (where AuthContext stores it)
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (userInfo && userInfo.token) {
      // If a token exists, add it to the Authorization header
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: This runs AFTER each response is received.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 403) {
      // Account suspended - logout user
      localStorage.removeItem('userInfo');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;