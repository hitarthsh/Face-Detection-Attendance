/**
 * Render Web Service URL (+ /api).
 * If you change the Render service name, update PRODUCTION_API_BASE_URL to match
 * (https://<service-name>.onrender.com/api).
 */
export const PRODUCTION_API_BASE_URL =
  'https://face-detection-attendance-zz1n.onrender.com/api';

/**
 * Must match `PORT` in backend/.env (this repo uses 10000 there).
 * Used for 10.0.2.2 / localhost in api.ts and for LAN URL below.
 */
export const LOCAL_DEV_API_PORT = 10000;

/**
 * Physical Android phone on same Wi-Fi as your PC:
 * set host to your PC IPv4 (`ipconfig` -> IPv4 Address).
 */
export const DEVELOPMENT_API_BASE_URL = `http://125.125.1.144:${LOCAL_DEV_API_PORT}/api`;

/**
 * How the app should connect to backend in development.
 * - auto: tries emulator, USB reverse, LAN, then production
 * - android-emulator: force 10.0.2.2
 * - android-usb: dev Android — tries emulator host (10.0.2.2), then LAN URL, then loopback
 *   (loopback only reaches your PC with `adb reverse tcp:<PORT> tcp:<PORT>` on a physical device)
 * - android-lan: force DEVELOPMENT_API_BASE_URL
 * - production: force cloud URL
 */
export type ApiConnectionTarget =
  | 'auto'
  | 'android-emulator'
  | 'android-usb'
  | 'android-lan'
  | 'production';

// Use local targets only during development. Release APK should default to cloud API.
export const API_CONNECTION_TARGET: ApiConnectionTarget = __DEV__
  ? 'android-usb'
  : 'production';
