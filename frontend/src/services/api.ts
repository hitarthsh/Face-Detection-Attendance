import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URLS = [
  // Physical Android via USB (requires adb reverse tcp:10000 tcp:10000)
  'http://localhost:10000/api',
  // Physical Android over Wi-Fi
  'http://125.125.1.144:10000/api',
  // Android emulator
  'http://10.0.2.2:10000/api',
  // Cloud fallback
  'https://face-detection-attendance-zz1n.onrender.com/api',
];

let baseUrlIndex = 0;
const getCurrentBaseUrl = () => BASE_URLS[baseUrlIndex]!;
const advanceBaseUrl = () => {
  if (baseUrlIndex < BASE_URLS.length - 1) {
    baseUrlIndex += 1;
    api.defaults.baseURL = getCurrentBaseUrl();
  }
};

const api = axios.create({
  baseURL: getCurrentBaseUrl(),
  timeout: 30000,
});

if (__DEV__) {
  // Helps verify which backend the app is actually targeting at runtime.
  console.log('[api] active baseURL:', getCurrentBaseUrl());
}

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For FormData requests, let the native adapter set multipart boundary.
    // Keeping JSON content-type here can cause backend to miss fields like employeeId.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers && typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Content-Type', undefined);
      } else if (config.headers) {
        delete (config.headers as any)['Content-Type'];
        delete (config.headers as any)['content-type'];
      }
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

        const { data } = await axios.post(`${getCurrentBaseUrl()}/auth/refresh`, {
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

    if (
      error.message === 'Network Error' &&
      originalRequest &&
      !originalRequest._baseUrlRetried &&
      baseUrlIndex < BASE_URLS.length - 1
    ) {
      originalRequest._baseUrlRetried = true;
      advanceBaseUrl();
      originalRequest.baseURL = getCurrentBaseUrl();
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;
