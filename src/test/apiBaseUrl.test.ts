import { afterEach, expect, it, vi } from 'vitest';
import { getApiBaseUrl, resolveApiUrl } from '../lib/api';
afterEach(() => vi.unstubAllEnvs());
it('resuelve JSON y medios con la misma base configurada sin duplicar el prefijo', () => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api/v1/');
  expect(resolveApiUrl('/api/v1/me')).toBe('https://api.example.test/api/v1/me');
  expect(resolveApiUrl('/media/key')).toBe('https://api.example.test/api/v1/media/key');
  vi.stubEnv('VITE_API_BASE_URL', ''); vi.stubEnv('VITE_API_URL', 'https://other.example.test/');
  expect(getApiBaseUrl()).toBe('https://other.example.test/api/v1');
  vi.stubEnv('VITE_API_URL', '');
  expect(getApiBaseUrl()).toBe('/api/v1');
});
