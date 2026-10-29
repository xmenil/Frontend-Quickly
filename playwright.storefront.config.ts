import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// UI regression only: every API request is intercepted by the spec. No database is started.
const edge = process.platform === 'win32' && existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
export default defineConfig({
  testDir: './e2e', testMatch: 'storefront.spec.ts', workers: 1, retries: 0,
  timeout: 30000, reporter: 'list',
  use: { baseURL: 'http://localhost:5175', headless: true, ...(edge ? { channel: 'msedge' } : {}), viewport: { width: 1366, height: 900 }, screenshot: 'only-on-failure' },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host localhost --port 5175',
    url: 'http://localhost:5175', reuseExistingServer: false,
    env: { VITE_API_BASE_URL: '/api/v1' },
  },
});
