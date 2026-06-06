// src/services/api.js
// Axios instance with automatic token injection and refresh handling

import axios from 'axios';

// ─── Base Instance ─────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,    // Send httpOnly cookies (for refresh token)
  timeout:         10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── In-memory token store ─────────────────────────────────────
// Access token lives in memory (not localStorage) — XSS safe
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

// ─── Request Interceptor ──────────────────────────────────────
// Attach access token to every request
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────
// On 401 with TOKEN_EXPIRED, silently refresh and retry
let isRefreshing  = false;
let pendingQueue  = []; // Queued requests waiting on token refresh

function processQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isExpiredError =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry; // Prevent infinite loops

    if (!isExpiredError) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Ask server to set new access token using httpOnly cookie
      const { data } = await api.post('/auth/refresh-token');
      const newToken = data.data.accessToken;

      setAccessToken(newToken);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAccessToken();
      // Trigger logout via custom event so AuthContext can react
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
