/**
 * Release builds use PRODUCTION_API_BASE_URL (Render Web Service + /api).
 * If you change the Render service name, update PRODUCTION_API_BASE_URL to match
 * (https://<service-name>.onrender.com/api).
 */
export const PRODUCTION_API_BASE_URL =
  'https://face-attendance-api.onrender.com/api';

/** Local / physical device — use your machine's LAN IP if testing on a phone. */
export const DEVELOPMENT_API_BASE_URL = 'http://125.125.1.144:5000/api';
