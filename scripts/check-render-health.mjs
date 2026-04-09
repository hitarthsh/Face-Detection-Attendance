#!/usr/bin/env node
/**
 * After deploying to Render, run: node scripts/check-render-health.mjs
 * Or: RENDER_HEALTH_URL=https://your-service.onrender.com/api/health node scripts/check-render-health.mjs
 */
const url =
  process.env.RENDER_HEALTH_URL ||
  'https://face-attendance-api.onrender.com/api/health';

const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
const text = await res.text();
console.log(res.status, res.ok ? 'OK' : 'FAIL');
if (!res.ok) process.exitCode = 1;
else console.log(text.slice(0, 500));
