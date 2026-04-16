import axios from 'axios';
import { useAuthStore } from '../app/authStore';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and 500+
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const auth = useAuthStore.getState();

    if (status === 401) {
      console.error('Unauthorized access - redirecting to login');
      auth.logout();
      window.location.href = '/login';
    }

    if (status >= 500) {
      console.error('Server error:', error.response?.data || error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
