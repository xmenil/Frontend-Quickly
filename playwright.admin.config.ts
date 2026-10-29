import { defineConfig } from '@playwright/test';
import base from './playwright.storefront.config';
export default defineConfig({ ...base, testMatch: 'admin-original.spec.ts', timeout: 90000, expect: { timeout: 15000 }, outputDir: 'test-results/admin',
 use: { ...base.use, baseURL: 'http://localhost:5178' },
 webServer: { command: 'node node_modules/vite/bin/vite.js --host localhost --port 5178', url: 'http://localhost:5178', reuseExistingServer: false,
  env: { VITE_API_BASE_URL: '/api/v1' } },
});
