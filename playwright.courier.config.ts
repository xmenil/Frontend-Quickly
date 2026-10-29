import { defineConfig } from '@playwright/test';
import base from './playwright.storefront.config';
export default defineConfig({ ...base, testMatch: 'courier-original.spec.ts', timeout: 60000,
 use: { ...base.use, baseURL: 'http://localhost:5177' },
 webServer: { command: 'node node_modules/vite/bin/vite.js --host localhost --port 5177', url: 'http://localhost:5177', reuseExistingServer: false,
  env: { VITE_API_BASE_URL: '/api/v1' } },
});
