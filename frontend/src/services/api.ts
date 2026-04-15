import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL =
  (globalThis as { process?: { env?: { BASE_URL?: string } } }).process?.env?.BASE_URL ||
  'https://face-detection-attendance-zz1n.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// ─── Response Interceptor (auto token refresh) ──────────────────────────────
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and force re-login
        // await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
