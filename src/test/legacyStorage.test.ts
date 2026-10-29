import { beforeEach, expect, it } from 'vitest';
import { legacyKeys, legacyNoticeKey, migrateLegacyStorage } from '../lib/legacyStorage';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
it('retira solo persistencia del prototipo y conserva carrito actual, recuperación y preferencias', () => {
  for (const key of legacyKeys) localStorage.setItem(key, 'dato heredado');
  const preserved = ['quickly_cart_real_v2', 'quickly_checkout_intent_v1:current-user', 'quickly_search_history_v2', 'theme', 'unrelated'];
  for (const key of preserved) localStorage.setItem(key, 'conservar');
  expect(migrateLegacyStorage()).toEqual([...legacyKeys]);
  for (const key of legacyKeys) expect(localStorage.getItem(key)).toBeNull();
  for (const key of preserved) expect(localStorage.getItem(key)).toBe('conservar');
  expect(localStorage.getItem(legacyNoticeKey)).toBe('1');
  localStorage.removeItem(legacyNoticeKey);
  expect(migrateLegacyStorage()).toEqual([]);
  expect(localStorage.getItem(legacyNoticeKey)).toBeNull();
});
it('retira el CSRF heredado de sessionStorage sin borrar otras preferencias de la pestaña', () => {
  sessionStorage.setItem('quickly_csrf', 'csrf-antiguo'); sessionStorage.setItem('tab-preference', 'conservar');
  expect(migrateLegacyStorage()).toEqual(['session:quickly_csrf']);
  expect(sessionStorage.getItem('quickly_csrf')).toBeNull();
  expect(sessionStorage.getItem('tab-preference')).toBe('conservar');
});
it('un navegador sin permiso de almacenamiento no impide restaurar sesión por API', () => {
  const restricted = { getItem() { throw new DOMException('Denied', 'SecurityError'); } } as unknown as Storage;
  expect(() => migrateLegacyStorage(restricted)).not.toThrow();
});
