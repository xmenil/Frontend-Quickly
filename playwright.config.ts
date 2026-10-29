import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Browser tests must never launch the API against the development database.
if (!/^\/quickly_test_[a-f0-9]{20}$/.test(new URL(process.env.DATABASE_URL || 'postgresql://localhost/invalid').pathname)) {
  throw new Error('Ejecute npm run harness:browser desde backend/ para crear una base aislada.');
}
const edge = process.platform === 'win32' && existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
export default defineConfig({
  testDir: './e2e', testMatch: ['original-integral.spec.ts'], fullyParallel: false, workers: 1, retries: 0, maxFailures: 1, timeout: 45000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5174', headless: true,
    ...(edge ? { channel: 'msedge' } : {}), screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 900 } },
  webServer: [
    { command: 'node ../backend/dist/main.js', url: 'http://127.0.0.1:3001/api/v1/health',
      env: { PORT: '3001', NODE_ENV: 'test', CORS_ORIGIN: 'http://localhost:5174', SESSION_COOKIE_SECURE: 'false' },
      reuseExistingServer: false, timeout: 30000 },
    { command: 'node node_modules/vite/bin/vite.js --host localhost --port 5174', url: 'http://localhost:5174',
      env: { VITE_API_BASE_URL: '/api/v1', API_PROXY_TARGET: 'http://127.0.0.1:3001' },
      reuseExistingServer: false, timeout: 30000 },
  ],
});
