import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_CONNECTION_TARGET,
  type ApiConnectionTarget,
  DEVELOPMENT_API_BASE_URL,
  LOCAL_DEV_API_PORT,
  PRODUCTION_API_BASE_URL,
} from '../config/apiBaseUrl';

const LOCAL_ANDROID_EMULATOR = `http://10.0.2.2:${LOCAL_DEV_API_PORT}/api`;
const LOCAL_LOOPBACK_IP = `http://127.0.0.1:${LOCAL_DEV_API_PORT}/api`;
const LOCAL_LOOPBACK = `http://localhost:${LOCAL_DEV_API_PORT}/api`;

/**
 * Android emulator → host PC is 10.0.2.2 (not localhost). Try it first in __DEV__ so
 * face upload does not depend on Render/internet. Release keeps cloud first.
 */
const buildBaseUrlList = (): string[] => {
  const byTarget = (target: ApiConnectionTarget): string[] => {
    switch (target) {
      case 'android-emulator':
        return [LOCAL_ANDROID_EMULATOR, PRODUCTION_API_BASE_URL];
      case 'android-usb':
        // Emulator: 127.0.0.1 is the emulator itself — use 10.0.2.2 first.
        // Physical USB: use adb reverse, then loopback works; or set DEVELOPMENT_API_BASE_URL (Wi‑Fi).
        return [
          LOCAL_ANDROID_EMULATOR,
          DEVELOPMENT_API_BASE_URL,
          LOCAL_LOOPBACK_IP,
          LOCAL_LOOPBACK,
          PRODUCTION_API_BASE_URL,
        ];
      case 'android-lan':
        return [DEVELOPMENT_API_BASE_URL, PRODUCTION_API_BASE_URL];
      case 'production':
        return [PRODUCTION_API_BASE_URL];
      case 'auto':
      default:
        return [];
    }
  };

  const forced = byTarget(API_CONNECTION_TARGET);
  if (forced.length > 0) {
    return forced;
  }

  if (__DEV__ && Platform.OS === 'android') {
    return [
      LOCAL_ANDROID_EMULATOR,
      LOCAL_LOOPBACK_IP,
      LOCAL_LOOPBACK,
      DEVELOPMENT_API_BASE_URL,
      PRODUCTION_API_BASE_URL,
    ];
  }
  if (__DEV__ && Platform.OS === 'ios') {
    return [
      LOCAL_LOOPBACK,
      DEVELOPMENT_API_BASE_URL,
      PRODUCTION_API_BASE_URL,
      LOCAL_ANDROID_EMULATOR,
    ];
  }
  return [
    PRODUCTION_API_BASE_URL,
    LOCAL_ANDROID_EMULATOR,
    LOCAL_LOOPBACK,
    DEVELOPMENT_API_BASE_URL,
  ];
};

const BASE_URLS = [...new Set(buildBaseUrlList())];

const buildAllHostsFailedMessage = (hostsTried: readonly string[]) =>
  [
    'Could not reach any API server over the network.',
    `App port: ${LOCAL_DEV_API_PORT} — must match PORT in backend/.env.`,
    '',
    'Try this:',
    `1) On your PC open http://127.0.0.1:${LOCAL_DEV_API_PORT}/api/health — if it fails, start the backend (npm run dev).`,
    '2) Windows Firewall: allow Node.js (or TCP ' +
      LOCAL_DEV_API_PORT +
      ') for Private networks (Metro on :8081 can work while :' +
      LOCAL_DEV_API_PORT +
      ' is still blocked).',
    '3) Emulator uses 10.0.2.2 to reach your PC — same as Metro.',
    '4) USB phone: run `adb reverse tcp:' +
      LOCAL_DEV_API_PORT +
      ' tcp:' +
      LOCAL_DEV_API_PORT +
      '` and use API_CONNECTION_TARGET=android-usb.',
    '5) Physical phone (Wi-Fi): set DEVELOPMENT_API_BASE_URL in apiBaseUrl.ts to your PC IPv4 and use API_CONNECTION_TARGET=android-lan.',
    '',
    'Hosts tried: ' + hostsTried.join(' → '),
  ].join('\n');

let baseUrlIndex = 0;
const getCurrentBaseUrl = () => BASE_URLS[baseUrlIndex]!;

/** Call before probing /health so each check starts from PRODUCTION again. */
export const resetApiBaseUrlIndex = () => {
  baseUrlIndex = 0;
  api.defaults.baseURL = getCurrentBaseUrl();
};

/**
 * Thrown after a successful token refresh on a multipart request.
 * React Native cannot replay the same FormData body — the caller must submit again.
 */
export const MULTIPART_RETRY_AFTER_AUTH = 'MULTIPART_RETRY_AFTER_AUTH';

/** Advance to next API base URL. Returns false if already on the last host. */
export const advanceToNextApiBaseUrl = (): boolean => {
  if (baseUrlIndex >= BASE_URLS.length - 1) return false;
  baseUrlIndex += 1;
  api.defaults.baseURL = getCurrentBaseUrl();
  return true;
};

export const isAxiosConnectivityFailure = (error: unknown) => {
  const err = error as { message?: string; code?: string; response?: unknown };
  if (err?.response) return false;
  const msg = String(err?.message || '').toLowerCase();
  const code = String((err as { code?: string }).code || '');
  return (
    msg === 'network error' ||
    msg.includes('network request failed') ||
    msg.includes('timeout') ||
    msg.includes('failed to connect') ||
    msg.includes('connection refused') ||
    msg.includes('networkerror') ||
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT'
  );
};

/**
 * POST multipart with a fresh FormData per attempt. Tries each BASE_URL on connectivity
 * failures (RN cannot safely replay the same FormData after a failed send).
 */
export async function postMultipartWithUrlFallback<T = unknown>(
  url: string,
  buildFormData: () => FormData,
  requestConfig?: Omit<AxiosRequestConfig, 'data'>
): Promise<AxiosResponse<T>> {
  resetApiBaseUrlIndex();
  const hostsOrder = [...BASE_URLS];
  const multipartConfig: Omit<AxiosRequestConfig, 'data'> = {
    ...(requestConfig || {}),
    headers: {
      ...((requestConfig?.headers as Record<string, unknown>) || {}),
      // Ensure RN/OkHttp sees a valid multipart media type.
      'Content-Type': 'multipart/form-data',
    },
  };
  for (;;) {
    const postOnce = async () => {
      try {
        return await api.post<T>(url, buildFormData(), multipartConfig);
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (err?.message === MULTIPART_RETRY_AFTER_AUTH) {
          return await api.post<T>(url, buildFormData(), multipartConfig);
        }
        throw e;
      }
    };
    try {
      return await postOnce();
    } catch (e) {
      if (isAxiosConnectivityFailure(e) && advanceToNextApiBaseUrl()) {
        if (__DEV__) {
          console.log('[api] multipart failover →', getCurrentBaseUrl());
        }
        continue;
      }
      if (isAxiosConnectivityFailure(e)) {
        throw new Error(buildAllHostsFailedMessage(hostsOrder));
      }
      throw e;
    }
  }
}

const api = axios.create({
  baseURL: getCurrentBaseUrl(),
  timeout: 30000,
});

if (__DEV__) {
  // Helps verify which backend the app is actually targeting at runtime.
  console.log('[api] active baseURL:', getCurrentBaseUrl());
  console.log('[api] connection target:', API_CONNECTION_TARGET);
}

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData requests are configured explicitly in postMultipartWithUrlFallback.
    return config;
  },
  error => Promise.reject(error),
);

// ─── Response Interceptor (auto token refresh) ──────────────────────────────
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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

        const isFormData =
          typeof FormData !== 'undefined' && originalRequest.data instanceof FormData;

        if (isFormData) {
          return Promise.reject(new Error(MULTIPART_RETRY_AFTER_AUTH));
        }

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
      isAxiosConnectivityFailure(error) &&
      originalRequest &&
      !originalRequest._baseUrlRetried &&
      baseUrlIndex < BASE_URLS.length - 1
    ) {
      const isFormData =
        typeof FormData !== 'undefined' && originalRequest.data instanceof FormData;
      if (!isFormData) {
        originalRequest._baseUrlRetried = true;
        if (!advanceToNextApiBaseUrl()) {
          return Promise.reject(error);
        }
        originalRequest.baseURL = getCurrentBaseUrl();
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
