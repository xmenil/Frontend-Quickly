import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { apiRequest, ApiError, onUnauthorized, resetApiSession, setCsrfToken } from '../services/api/apiClient';

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { resetApiSession(); vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset(); });
afterEach(() => { vi.unstubAllGlobals(); });

it('envía cookies y CSRF en mutaciones, sin Authorization ni token persistido', async () => {
  setCsrfToken('csrf-en-memoria');
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  await apiRequest('/me', { method: 'PATCH', body: { fullName: 'Nombre real' } });
  expect(fetchMock).toHaveBeenCalledWith('/api/v1/me', expect.objectContaining({ credentials: 'include', method: 'PATCH',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': 'csrf-en-memoria' } }));
});
it('un 204 no intenta parsear JSON', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  expect(await apiRequest('/auth/logout', { method: 'POST' })).toBeUndefined();
});
it('401 invalida sesión una vez y 403 conserva identidad', async () => {
  const handler = vi.fn(); onUnauthorized(handler);
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ code: 'FORBIDDEN', message: 'Sin acceso' }), { status: 403 }));
  await expect(apiRequest('/admin')).rejects.toMatchObject({ status: 403 });
  expect(handler).not.toHaveBeenCalled();
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ code: 'INVALID_SESSION', message: 'Sesión vencida', requestId: 'test' }), { status: 401 }));
  await expect(apiRequest('/me')).rejects.toMatchObject({ status: 401, requestId: 'test' });
  expect(handler).toHaveBeenCalledTimes(1);
});
it('un rechazo del login no dispara la política de sesión vencida', async () => {
  const handler = vi.fn(); onUnauthorized(handler);
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ code: 'INVALID_CREDENTIALS', message: 'Incorrecto' }), { status: 401 }));
  await expect(apiRequest('/auth/login', { method: 'POST', publicRequest: true })).rejects.toBeInstanceOf(ApiError);
  expect(handler).not.toHaveBeenCalled();
});
it('descarta respuestas que llegaron después de cerrar o cambiar sesión', async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const request = apiRequest('/me'); resetApiSession();
  finish(new Response(JSON.stringify({ fullName: 'Persona anterior' }), { status: 200 }));
  await expect(request).rejects.toMatchObject({ code: 'REQUEST_SUPERSEDED' });
});
it('distingue errores de red y no reintenta automáticamente una mutación', async () => {
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(apiRequest('/purchases', { method: 'POST', body: {} })).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
