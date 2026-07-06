import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const authService = {
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await axios.get(`${API_URL}/api/auth/verify?token=${token}`);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('token_type', response.data.token_type);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
  },

  forgotPassword: async (email) => {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    return response.data;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const response = await axios.post(`${API_URL}/api/auth/reset-password?token=${token}`, {
      password,
      confirm_password: confirmPassword
    });
    return response.data;
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  }
};

export default authService;
