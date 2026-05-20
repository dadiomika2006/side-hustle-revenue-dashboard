import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
const getToken = () => localStorage.getItem('token');

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized access
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location = '/login';
    }
    return Promise.reject(error);
  }
);

// ── OTP API calls (added for "Try Another Way" login) ────────────────────────

// Send OTP to email or phone
export const sendOtp = (target) =>
  api.post('/auth/send-otp', { target });

// Verify OTP and get back token + user
export const verifyOtp = (target, otp) =>
  api.post('/auth/verify-otp', { target, otp });

// ─────────────────────────────────────────────────────────────────────────────

export default api;