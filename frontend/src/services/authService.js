// src/services/authService.js
// Wraps auth API calls — keeps components clean

import api, { setAccessToken, clearAccessToken } from './api';

const authService = {
  async register({ username, email, password }) {
    const { data } = await api.post('/auth/register', { username, email, password });
    setAccessToken(data.data.accessToken);
    return data.data.user;
  },

  async login({ email, password }) {
    const { data } = await api.post('/api/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    return data.data.user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
    }
  },

  async getMe() {
    const { data } = await api.get('/users/me');
    return data.data.user;
  },
};

export default authService;
