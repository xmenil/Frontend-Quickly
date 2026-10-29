import { defineConfig } from '@playwright/test';
import base from './playwright.storefront.config';
export default defineConfig({ ...base, testMatch: 'checkout-original.spec.ts',
 use: { ...base.use, baseURL: 'http://localhost:5176' },
 webServer: { command: 'node node_modules/vite/bin/vite.js --host localhost --port 5176', url: 'http://localhost:5176', reuseExistingServer: false,
  env: { VITE_API_BASE_URL: '/api/v1' } },
});
